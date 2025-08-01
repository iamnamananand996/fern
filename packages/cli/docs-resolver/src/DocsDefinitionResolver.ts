import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import { readFile, stat } from "fs/promises";
import matter from "gray-matter";
import { kebabCase } from "lodash-es";
import urlJoin from "url-join";

import { SourceResolverImpl } from "@fern-api/cli-source-resolver";
import { WithoutQuestionMarks, docsYml, parseDocsConfiguration } from "@fern-api/configuration-loader";
import { assertNever, isNonNullish, visitDiscriminatedUnion } from "@fern-api/core-utils";
import {
    parseImagePaths,
    replaceImagePathsAndUrls,
    replaceReferencedCode,
    replaceReferencedMarkdown
} from "@fern-api/docs-markdown-utils";
import { APIV1Write, DocsV1Write, FdrAPI, FernNavigation } from "@fern-api/fdr-sdk";
import {
    AbsoluteFilePath,
    RelativeFilePath,
    doesPathExist,
    join,
    listFiles,
    relative,
    resolve
} from "@fern-api/fs-utils";
import { generateIntermediateRepresentation } from "@fern-api/ir-generator";
import { IntermediateRepresentation } from "@fern-api/ir-sdk";
import { OSSWorkspace } from "@fern-api/lazy-fern-workspace";
import { TaskContext } from "@fern-api/task-context";
import { AbstractAPIWorkspace, DocsWorkspace, FernWorkspace } from "@fern-api/workspace-loader";

import { ApiReferenceNodeConverter } from "./ApiReferenceNodeConverter";
import { ApiReferenceNodeConverterLatest } from "./ApiReferenceNodeConverterLatest";
import { ChangelogNodeConverter } from "./ChangelogNodeConverter";
import { NodeIdGenerator } from "./NodeIdGenerator";
import { convertDocsSnippetsConfigToFdr } from "./utils/convertDocsSnippetsConfigToFdr";
import { convertIrToApiDefinition } from "./utils/convertIrToApiDefinition";
import { generateFdrFromOpenApiWorkspace } from "./utils/generateFdrFromOpenApiWorkspace";
import { generateFdrFromOpenrpc } from "./utils/generateFdrFromOpenrpc";
import { collectFilesFromDocsConfig } from "./utils/getImageFilepathsToUpload";
import { visitNavigationAst } from "./visitNavigationAst";
import { wrapWithHttps } from "./wrapWithHttps";

dayjs.extend(utc);

export interface FilePathPair {
    absoluteFilePath: AbsoluteFilePath;
    relativeFilePath: RelativeFilePath;
}

export interface UploadedFile extends FilePathPair {
    fileId: string;
}

export type PlaygroundConfig = Pick<docsYml.RawSchemas.PlaygroundSettings, "oauth">;

type AsyncOrSync<T> = T | Promise<T>;

type UploadFilesFn = (files: FilePathPair[]) => AsyncOrSync<UploadedFile[]>;

type RegisterApiFn = (opts: {
    ir: IntermediateRepresentation;
    snippetsConfig: APIV1Write.SnippetsConfig;
    playgroundConfig?: PlaygroundConfig;
    apiName?: string;
}) => AsyncOrSync<string>;

type RegisterApiV2Fn = (opts: {
    api: FdrAPI.api.latest.ApiDefinition;
    snippetsConfig: APIV1Write.SnippetsConfig;
    apiName?: string;
}) => AsyncOrSync<string>;

const defaultUploadFiles: UploadFilesFn = (files) => {
    return files.map((file) => ({ ...file, fileId: String(file.relativeFilePath) }));
};

let apiCounter = 0;
const defaultRegisterApi: RegisterApiFn = async ({ ir }) => {
    apiCounter++;
    return `${ir.apiName.snakeCase.unsafeName}-${apiCounter}`;
};

const defaultRegisterApiV2: RegisterApiV2Fn = async ({ api }) => {
    apiCounter++;
    return `${api.id}-${apiCounter}`;
};

export class DocsDefinitionResolver {
    constructor(
        private domain: string,
        private docsWorkspace: DocsWorkspace,
        private ossWorkspaces: OSSWorkspace[],
        private apiWorkspaces: AbstractAPIWorkspace<unknown>[],
        private taskContext: TaskContext,
        // Optional
        private editThisPage?: docsYml.RawSchemas.EditThisPageConfig,
        private uploadFiles: UploadFilesFn = defaultUploadFiles,
        private registerApi: RegisterApiFn = defaultRegisterApi,
        private registerApiV2: RegisterApiV2Fn = defaultRegisterApiV2
    ) {}

    #idgen = NodeIdGenerator.init();

    private _parsedDocsConfig: WithoutQuestionMarks<docsYml.ParsedDocsConfiguration> | undefined;
    private get parsedDocsConfig(): WithoutQuestionMarks<docsYml.ParsedDocsConfiguration> {
        if (this._parsedDocsConfig == null) {
            throw new Error("parsedDocsConfig is not set");
        }
        return this._parsedDocsConfig;
    }
    private collectedFileIds = new Map<AbsoluteFilePath, string>();
    private markdownFilesToFullSlugs: Map<AbsoluteFilePath, string> = new Map();
    private markdownFilesToNoIndex: Map<AbsoluteFilePath, boolean> = new Map();
    public async resolve(): Promise<DocsV1Write.DocsDefinition> {
        this._parsedDocsConfig = await parseDocsConfiguration({
            rawDocsConfiguration: this.docsWorkspace.config,
            context: this.taskContext,
            absolutePathToFernFolder: this.docsWorkspace.absoluteFilePath,
            absoluteFilepathToDocsConfig: this.docsWorkspace.absoluteFilepathToDocsConfig
        });

        // track all changelog markdown files in parsedDocsConfig.pages
        const openapiParserV3 = this.parsedDocsConfig.experimental?.openapiParserV3;
        const useV1Parser = openapiParserV3 != null && !openapiParserV3;
        if (this.docsWorkspace.config.navigation != null && useV1Parser) {
            await visitNavigationAst({
                navigation: this.docsWorkspace.config.navigation,
                visitor: {
                    apiSection: async ({ workspace }) => {
                        const fernWorkspace = await workspace.toFernWorkspace(
                            { context: this.taskContext },

                            {
                                enableUniqueErrorsPerEndpoint: true,
                                detectGlobalHeaders: false,
                                preserveSchemaIds: true,
                                objectQueryParameters: true,
                                respectReadonlySchemas: true
                            }
                        );
                        fernWorkspace.changelog?.files.forEach((file) => {
                            const relativePath = relative(this.docsWorkspace.absoluteFilePath, file.absoluteFilepath);
                            this.parsedDocsConfig.pages[relativePath] = file.contents;
                        });
                    }
                },
                apiWorkspaces: this.apiWorkspaces,
                context: this.taskContext
            });
        }

        // create a map of markdown files to their URL pathnames
        // this will be used to resolve relative markdown links to their final URLs
        this.markdownFilesToFullSlugs = await this.getMarkdownFilesToFullSlugs(this.parsedDocsConfig.pages);

        // create a map of markdown files to their noindex values
        this.markdownFilesToNoIndex = await this.getMarkdownFilesToNoIndex(this.parsedDocsConfig.pages);

        // replaces all instances of <Markdown src="path/to/file.md" /> with the content of the referenced markdown file
        // this should happen before we parse image paths, as the referenced markdown files may contain images.
        for (const [relativePath, markdown] of Object.entries(this.parsedDocsConfig.pages)) {
            this.parsedDocsConfig.pages[RelativeFilePath.of(relativePath)] = await replaceReferencedMarkdown({
                markdown,
                absolutePathToFernFolder: this.docsWorkspace.absoluteFilePath,
                absolutePathToMarkdownFile: this.resolveFilepath(relativePath),
                context: this.taskContext
            });
        }

        // replaces all instances of <Code src="path/to/file.js" /> with the content of the referenced code file
        for (const [relativePath, markdown] of Object.entries(this.parsedDocsConfig.pages)) {
            this.parsedDocsConfig.pages[RelativeFilePath.of(relativePath)] = await replaceReferencedCode({
                markdown,
                absolutePathToFernFolder: this.docsWorkspace.absoluteFilePath,
                absolutePathToMarkdownFile: this.resolveFilepath(relativePath),
                context: this.taskContext
            });
        }

        const filesToUploadSet = await collectFilesFromDocsConfig({
            parsedDocsConfig: this.parsedDocsConfig,
            docsWorkspace: this.docsWorkspace
        });

        // preprocess markdown files to extract image paths
        for (const [relativePath, markdown] of Object.entries(this.parsedDocsConfig.pages)) {
            try {
                const { filepaths, markdown: newMarkdown } = parseImagePaths(markdown, {
                    absolutePathToMarkdownFile: this.resolveFilepath(relativePath),
                    absolutePathToFernFolder: this.docsWorkspace.absoluteFilePath
                });

                // store the updated markdown in pages
                this.parsedDocsConfig.pages[RelativeFilePath.of(relativePath)] = newMarkdown;

                // store the image filepaths to upload
                for (const filepath of filepaths) {
                    filesToUploadSet.add(filepath);
                }
            } catch (error) {
                this.taskContext.logger.error(
                    `Failed to parse ${relativePath}: ${error instanceof Error ? error.message : String(error)}`
                );
                throw error;
            }
        }

        const filesToUpload: FilePathPair[] = Array.from(filesToUploadSet).map(
            (absoluteFilePath): FilePathPair => ({
                absoluteFilePath,
                relativeFilePath: this.toRelativeFilepath(absoluteFilePath)
            })
        );

        const uploadedFiles = await this.uploadFiles(filesToUpload);

        uploadedFiles.forEach((uploadedFile) => {
            this.collectedFileIds.set(uploadedFile.absoluteFilePath, uploadedFile.fileId);
        });

        // postprocess markdown files after uploading all images to replace the image paths in the markdown files with the fileIDs

        // TODO: include more (canonical) slugs from the navigation tree
        const markdownFilesToPathName: Record<AbsoluteFilePath, string> =
            await this.getMarkdownFilesToFullyQualifiedPathNames();

        for (const [relativePath, markdown] of Object.entries(this.parsedDocsConfig.pages)) {
            this.parsedDocsConfig.pages[RelativeFilePath.of(relativePath)] = replaceImagePathsAndUrls(
                markdown,
                this.collectedFileIds,
                // convert slugs to full URL pathnames
                markdownFilesToPathName,
                {
                    absolutePathToMarkdownFile: this.resolveFilepath(relativePath),
                    absolutePathToFernFolder: this.docsWorkspace.absoluteFilePath
                },
                this.taskContext
            );
        }

        const pages: Record<DocsV1Write.PageId, DocsV1Write.PageContent> = {};

        Object.entries(this.parsedDocsConfig.pages).forEach(([relativePageFilepath, markdown]) => {
            const url = createEditThisPageUrl(this.editThisPage, relativePageFilepath);
            pages[DocsV1Write.PageId(relativePageFilepath)] = {
                markdown,
                editThisPageUrl: url ? DocsV1Write.Url(url) : undefined
            };
        });

        const config = await this.convertDocsConfiguration();

        // detect experimental js files to include in the docs
        let jsFiles: Record<string, string> = {};
        if (this._parsedDocsConfig.experimental?.mdxComponents != null) {
            const jsFilePaths = new Set<AbsoluteFilePath>();
            await Promise.all(
                this._parsedDocsConfig.experimental.mdxComponents.map(async (filepath) => {
                    const absoluteFilePath = resolve(this.docsWorkspace.absoluteFilePath, filepath);

                    // check if absoluteFilePath is a directory or a file
                    const stats = await stat(absoluteFilePath);

                    if (stats.isDirectory()) {
                        const files = await listFiles(absoluteFilePath, "{js,ts,jsx,tsx,md,mdx}");

                        files.forEach((file) => {
                            jsFilePaths.add(file);
                        });
                    } else if (absoluteFilePath.match(/\.(js|ts|jsx|tsx|md|mdx)$/) != null) {
                        jsFilePaths.add(absoluteFilePath);
                    }
                })
            );

            jsFiles = Object.fromEntries(
                await Promise.all(
                    [...jsFilePaths].map(async (filePath): Promise<[string, string]> => {
                        const relativeFilePath = this.toRelativeFilepath(filePath);
                        const contents = (await readFile(filePath)).toString();
                        return [relativeFilePath, contents];
                    })
                )
            );
        }

        return { config, pages, jsFiles };
    }

    private resolveFilepath(unresolvedFilepath: string): AbsoluteFilePath;
    private resolveFilepath(unresolvedFilepath: string | undefined): AbsoluteFilePath | undefined;
    private resolveFilepath(unresolvedFilepath: string | undefined): AbsoluteFilePath | undefined {
        if (unresolvedFilepath == null) {
            return undefined;
        }
        return resolve(this.docsWorkspace.absoluteFilePath, unresolvedFilepath);
    }

    private toRelativeFilepath(filepath: AbsoluteFilePath): RelativeFilePath;
    private toRelativeFilepath(filepath: AbsoluteFilePath | undefined): RelativeFilePath | undefined;
    private toRelativeFilepath(filepath: AbsoluteFilePath | undefined): RelativeFilePath | undefined {
        if (filepath == null) {
            return undefined;
        }
        return relative(this.docsWorkspace.absoluteFilePath, filepath);
    }

    /**
     * Creates a map of markdown files to their full slugs specified in the frontmatter only
     * @param pages - the pages to convert to slugs
     * @returns a map of markdown files to their full slugs
     */
    private async getMarkdownFilesToFullSlugs(
        pages: Record<RelativeFilePath, string>
    ): Promise<Map<AbsoluteFilePath, string>> {
        const mdxFilePathToSlug = new Map<AbsoluteFilePath, string>();
        for (const [relativePath, markdown] of Object.entries(pages)) {
            const frontmatter = matter(markdown);
            const slug = frontmatter.data.slug;
            if (typeof slug === "string" && slug.trim().length > 0) {
                mdxFilePathToSlug.set(this.resolveFilepath(relativePath), slug.trim());
            }
        }
        return mdxFilePathToSlug;
    }

    /**
     * Creates a list of markdown files that have noindex:true specified in the frontmatter
     * @param pages - the pages to check
     * @returns a map of markdown files to their noindex value
     */
    private async getMarkdownFilesToNoIndex(
        pages: Record<RelativeFilePath, string>
    ): Promise<Map<AbsoluteFilePath, boolean>> {
        const mdxFilePathToNoIndex = new Map<AbsoluteFilePath, boolean>();
        for (const [relativePath, markdown] of Object.entries(pages)) {
            const frontmatter = matter(markdown);
            const noindex = frontmatter.data.noindex;
            if (typeof noindex === "boolean") {
                mdxFilePathToNoIndex.set(this.resolveFilepath(relativePath), noindex);
            }
        }
        return mdxFilePathToNoIndex;
    }

    /**
     * Creates a map of markdown files to their fully qualified pathnames, based on the entire navigation tree
     * FernNavigation NodeCollector already includes basepath in slugmap
     * @returns a map of markdown files to their fully qualified pathnames
     */
    private async getMarkdownFilesToFullyQualifiedPathNames(): Promise<Record<AbsoluteFilePath, string>> {
        const markdownFilesToPathName: Record<AbsoluteFilePath, string> = {};
        const root = FernNavigation.migrate.FernNavigationV1ToLatest.create().root(await this.toRootNode());

        // all the page slugs in the docs:
        const collector = FernNavigation.NodeCollector.collect(root);
        collector.slugMap.forEach((node, slug) => {
            if (node == null || !FernNavigation.isPage(node)) {
                return;
            }

            const pageId = FernNavigation.getPageId(node);
            if (pageId == null) {
                return;
            }

            const absoluteFilePath = join(this.docsWorkspace.absoluteFilePath, RelativeFilePath.of(pageId));
            markdownFilesToPathName[absoluteFilePath] = slug;
        });
        return markdownFilesToPathName;
    }

    private getDocsBasePath(): string {
        const url = new URL(wrapWithHttps(this.domain));
        return url.pathname;
    }

    private async convertDocsConfiguration(): Promise<DocsV1Write.DocsConfig> {
        const root = await this.toRootNode();
        const config: DocsV1Write.DocsConfig = {
            aiChatConfig:
                this.parsedDocsConfig.aiChatConfig != null
                    ? {
                          model: this.parsedDocsConfig.aiChatConfig.model,
                          systemPrompt: this.parsedDocsConfig.aiChatConfig.systemPrompt
                      }
                    : undefined,
            hideNavLinks: undefined,
            title: this.parsedDocsConfig.title,
            logoHeight: this.parsedDocsConfig.logo?.height,
            logoHref: this.parsedDocsConfig.logo?.href ? DocsV1Write.Url(this.parsedDocsConfig.logo?.href) : undefined,
            favicon: this.getFileId(this.parsedDocsConfig.favicon),
            navigation: undefined, // <-- this is now deprecated
            root,
            colorsV3: this.convertColorConfigImageReferences(),
            navbarLinks: this.parsedDocsConfig.navbarLinks?.map((navbarLink) => ({
                ...navbarLink,
                url: DocsV1Write.Url(navbarLink.url)
            })),
            typographyV2: this.convertDocsTypographyConfiguration(),
            layout: this.parsedDocsConfig.layout,
            css: this.parsedDocsConfig.css,
            js: this.convertJavascriptConfiguration(),
            metadata: this.convertMetadata(),
            redirects: this.parsedDocsConfig.redirects,
            integrations: this.parsedDocsConfig.integrations,
            footerLinks: this.parsedDocsConfig.footerLinks?.map((footerLink) => ({
                ...footerLink,
                value: DocsV1Write.Url(footerLink.value)
            })),
            defaultLanguage: this.parsedDocsConfig.defaultLanguage,
            analyticsConfig: {
                ...this.parsedDocsConfig.analyticsConfig,
                segment: this.parsedDocsConfig.analyticsConfig?.segment,
                fullstory: this.parsedDocsConfig.analyticsConfig?.fullstory,
                intercom: this.parsedDocsConfig.analyticsConfig?.intercom
                    ? {
                          appId: this.parsedDocsConfig.analyticsConfig.intercom.appId,
                          apiBase: this.parsedDocsConfig.analyticsConfig.intercom.apiBase
                      }
                    : undefined,
                posthog: this.parsedDocsConfig.analyticsConfig?.posthog
                    ? {
                          apiKey: this.parsedDocsConfig.analyticsConfig.posthog.apiKey,
                          endpoint: this.parsedDocsConfig.analyticsConfig.posthog.endpoint
                      }
                    : undefined,
                gtm: this.parsedDocsConfig.analyticsConfig?.gtm
                    ? {
                          containerId: this.parsedDocsConfig.analyticsConfig.gtm.containerId
                      }
                    : undefined,
                ga4: this.parsedDocsConfig.analyticsConfig?.ga4
                    ? {
                          measurementId: this.parsedDocsConfig.analyticsConfig.ga4.measurementId
                      }
                    : undefined,
                amplitude: undefined,
                mixpanel: undefined,
                hotjar: undefined,
                koala: undefined,
                logrocket: undefined,
                pirsch: undefined,
                plausible: undefined,
                fathom: undefined,
                clearbit: undefined,
                heap: undefined
            },
            announcement:
                this.parsedDocsConfig.announcement != null
                    ? { text: this.parsedDocsConfig.announcement.message }
                    : undefined,
            // deprecated
            logo: undefined,
            logoV2: undefined,
            colors: undefined,
            colorsV2: undefined,
            typography: undefined,
            backgroundImage: undefined
        };
        return config;
    }

    private getFernWorkspaceForApiSection(
        apiSection: docsYml.DocsNavigationItem.ApiSection
    ): AbstractAPIWorkspace<unknown> {
        if (apiSection.apiName != null) {
            const apiWorkspace = this.apiWorkspaces.find((workspace) => {
                return workspace.workspaceName === apiSection.apiName;
            });
            if (apiWorkspace != null) {
                return apiWorkspace;
            }
        } else if (this.apiWorkspaces.length === 1 && this.apiWorkspaces[0] != null) {
            return this.apiWorkspaces[0];
        }
        const errorMessage = apiSection.apiName
            ? `Failed to load API Definition '${apiSection.apiName}' referenced in docs`
            : "Failed to load API Definition referenced in docs";
        throw new Error(errorMessage);
    }

    private getOpenApiWorkspaceForApiSection(apiSection: docsYml.DocsNavigationItem.ApiSection): OSSWorkspace {
        if (apiSection.apiName != null) {
            const ossWorkspace = this.ossWorkspaces.find((workspace) => workspace.workspaceName === apiSection.apiName);
            if (ossWorkspace != null) {
                return ossWorkspace;
            }
        } else if (this.ossWorkspaces.length === 1 && this.ossWorkspaces[0] != null) {
            return this.ossWorkspaces[0];
        }
        const errorMessage = apiSection.apiName
            ? `Failed to load API Definition '${apiSection.apiName}' referenced in docs`
            : "Failed to load API Definition referenced in docs";
        throw new Error(errorMessage);
    }

    private async toRootNode(): Promise<FernNavigation.V1.RootNode> {
        const slug = FernNavigation.V1.SlugGenerator.init(FernNavigation.slugjoin(this.getDocsBasePath()));
        const id = this.#idgen.get("root");

        const child: FernNavigation.V1.RootChild = await this.toRootChild(slug);

        return {
            type: "root",
            version: "v1",
            id,
            child,
            slug: slug.get(),
            // TODO: should this be "Documentation" by default? Or can we use the org name here?
            title: this.parsedDocsConfig.title ?? "Documentation",
            hidden: false,
            icon: undefined,
            pointsTo: undefined,
            authed: undefined,
            viewers: undefined,
            orphaned: undefined,
            roles: this.parsedDocsConfig.roles?.map((role) => FernNavigation.RoleId(role)),
            featureFlags: undefined
        };
    }

    private async toRootChild(slug: FernNavigation.V1.SlugGenerator): Promise<FernNavigation.V1.RootChild> {
        return visitDiscriminatedUnion(this.parsedDocsConfig.navigation)._visit<Promise<FernNavigation.V1.RootChild>>({
            untabbed: (untabbed) =>
                this.toUnversionedNode({
                    landingPage: this.parsedDocsConfig.landingPage,
                    navigationConfig: untabbed,
                    parentSlug: slug
                }),
            tabbed: (tabbed) =>
                this.toUnversionedNode({
                    landingPage: this.parsedDocsConfig.landingPage,
                    navigationConfig: tabbed,
                    parentSlug: slug
                }),
            versioned: (versioned) => this.toVersionedNode(versioned, slug),
            productgroup: (productGroup) =>
                this.toProductGroupNode({
                    landingPageConfig: this.parsedDocsConfig.landingPage,
                    productGroup,
                    parentSlug: slug
                })
        });
    }

    private toLandingPageNode(
        landingPageConfig: docsYml.DocsNavigationItem.Page,
        parentSlug: FernNavigation.V1.SlugGenerator
    ): FernNavigation.V1.LandingPageNode {
        const pageId = FernNavigation.PageId(this.toRelativeFilepath(landingPageConfig.absolutePath));
        const slug = parentSlug.apply({
            urlSlug: landingPageConfig.slug ?? kebabCase(landingPageConfig.title),
            fullSlug: this.markdownFilesToFullSlugs.get(landingPageConfig.absolutePath)?.split("/")
        });
        return {
            type: "landingPage",
            id: this.#idgen.get(pageId),
            title: landingPageConfig.title,
            slug: slug.get(),
            icon: landingPageConfig.icon,
            hidden: landingPageConfig.hidden,
            viewers: landingPageConfig.viewers,
            orphaned: landingPageConfig.orphaned,
            pageId,
            authed: undefined,
            noindex: landingPageConfig.noindex || this.markdownFilesToNoIndex.get(landingPageConfig.absolutePath),
            featureFlags: landingPageConfig.featureFlags
        };
    }

    private async toUnversionedNode({
        landingPage: landingPageConfig,
        navigationConfig,
        parentSlug
    }: {
        landingPage: docsYml.DocsNavigationItem.Page | undefined;
        navigationConfig: docsYml.UnversionedNavigationConfiguration;
        parentSlug: FernNavigation.V1.SlugGenerator;
    }): Promise<FernNavigation.V1.UnversionedNode> {
        const id = this.#idgen.get("unversioned");
        const landingPage: FernNavigation.V1.LandingPageNode | undefined =
            landingPageConfig != null ? this.toLandingPageNode(landingPageConfig, parentSlug) : undefined;

        const child =
            navigationConfig.type === "tabbed"
                ? await this.convertTabbedNavigation(id, navigationConfig.items, parentSlug)
                : await this.toSidebarRootNode(id, navigationConfig.items, parentSlug);

        return { type: "unversioned", id, landingPage, child };
    }

    private async toVersionedNode(
        versioned: docsYml.VersionedDocsNavigation,
        parentSlug: FernNavigation.V1.SlugGenerator
    ): Promise<FernNavigation.V1.VersionedNode> {
        const id = this.#idgen.get("versioned");

        return {
            id,
            type: "versioned",
            // TODO: should the first version always be default? We should make this configurable.
            children: await Promise.all(
                versioned.versions.map((item, idx) => this.toVersionNode(item, parentSlug, idx === 0))
            )
        };
    }

    private async toProductGroupNode({
        productGroup,
        landingPageConfig,
        parentSlug
    }: {
        productGroup: docsYml.ProductGroupDocsNavigation;
        landingPageConfig: docsYml.DocsNavigationItem.Page | undefined;
        parentSlug: FernNavigation.V1.SlugGenerator;
    }): Promise<FernNavigation.V1.ProductGroupNode> {
        const id = this.#idgen.get("productgroup");
        const landingPage: FernNavigation.V1.LandingPageNode | undefined =
            landingPageConfig != null ? this.toLandingPageNode(landingPageConfig, parentSlug) : undefined;
        return {
            id,
            type: "productgroup",
            landingPage,
            children: await Promise.all(productGroup.products.map((product) => this.toProductNode(product, parentSlug)))
        };
    }

    private async toProductNode(
        product: docsYml.ProductInfo,
        parentSlug: FernNavigation.V1.SlugGenerator
    ): Promise<FernNavigation.V1.ProductNode> {
        const slug = parentSlug.setProductSlug(product.slug ?? kebabCase(product.product));
        let child: FernNavigation.V1.ProductChild;
        switch (product.navigation.type) {
            case "tabbed":
                child = {
                    type: "unversioned",
                    id: this.#idgen.get(product.product),
                    landingPage: undefined,
                    child: await this.convertTabbedNavigation(
                        this.#idgen.get(product.product),
                        product.navigation.items,
                        slug
                    )
                };
                break;
            case "untabbed":
                child = {
                    type: "unversioned",
                    id: this.#idgen.get(product.product),
                    landingPage: undefined,
                    child: await this.toSidebarRootNode(
                        this.#idgen.get(product.product),
                        product.navigation.items,
                        slug
                    )
                };
                break;
            case "versioned":
                child = await this.toVersionedNode(product.navigation, slug);
                break;
            default:
                assertNever(product.navigation);
        }
        return {
            type: "product",
            id: this.#idgen.get(product.product),
            productId: FernNavigation.V1.ProductId(product.product),
            title: product.product,
            subtitle: product.subtitle ?? "",
            slug: slug.get(),
            child,
            default: false,
            hidden: undefined,
            authed: undefined,
            icon: product.icon,
            image: product.image != null ? this.getFileId(product.image) : undefined,
            pointsTo: undefined,
            viewers: product.viewers,
            orphaned: product.orphaned,
            featureFlags: product.featureFlags
        };
    }

    private async toVersionNode(
        version: docsYml.VersionInfo,
        parentSlug: FernNavigation.V1.SlugGenerator,
        isDefault: boolean
    ): Promise<FernNavigation.V1.VersionNode> {
        const id = this.#idgen.get(version.version);
        const slug = parentSlug.setVersionSlug(version.slug ?? kebabCase(version.version));
        const child =
            version.navigation.type === "tabbed"
                ? await this.convertTabbedNavigation(id, version.navigation.items, slug)
                : await this.toSidebarRootNode(id, version.navigation.items, slug);
        return {
            type: "version",
            id,
            versionId: FernNavigation.VersionId(version.version),
            title: version.version,
            slug: slug.get(),
            child,
            // TODO: the `default` property should be deprecated, and moved to the parent `versioned` node
            default: isDefault,
            availability: version.availability != null ? convertAvailability(version.availability) : undefined,
            landingPage: version.landingPage ? this.toLandingPageNode(version.landingPage, slug) : undefined,
            hidden: undefined,
            authed: undefined,
            viewers: version.viewers,
            orphaned: version.orphaned,
            icon: undefined,
            pointsTo: undefined,
            featureFlags: version.featureFlags
        };
    }

    private async toSidebarRootNode(
        prefix: string,
        items: docsYml.DocsNavigationItem[],
        parentSlug: FernNavigation.V1.SlugGenerator
    ): Promise<FernNavigation.V1.SidebarRootNode> {
        const id = this.#idgen.get(`${prefix}/root`);

        const children = await Promise.all(items.map((item) => this.toNavigationChild(id, item, parentSlug)));

        const grouped: FernNavigation.V1.SidebarRootChild[] = [];
        children.forEach((child) => {
            if (child.type === "apiReference") {
                grouped.push(child);
                return;
            }

            if (child.type === "section" && !child.collapsed) {
                grouped.push(child);
                return;
            }

            const lastChild = grouped.length > 0 ? grouped[grouped.length - 1] : undefined;
            let sidebarGroup: FernNavigation.V1.SidebarGroupNode;
            if (lastChild?.type === "sidebarGroup") {
                sidebarGroup = lastChild;
            } else {
                sidebarGroup = {
                    id: this.#idgen.get(`${id}/group`),
                    type: "sidebarGroup",
                    children: []
                };
                grouped.push(sidebarGroup);
            }

            sidebarGroup.children.push(child);
        });

        return {
            type: "sidebarRoot",
            id,
            children: grouped
        };
    }

    private async toNavigationChild(
        prefix: string,
        item: docsYml.DocsNavigationItem,
        parentSlug: FernNavigation.V1.SlugGenerator,
        hideChildren?: boolean
    ): Promise<FernNavigation.V1.NavigationChild> {
        return visitDiscriminatedUnion(item)._visit<Promise<FernNavigation.V1.NavigationChild>>({
            page: async (value) => this.toPageNode(value, parentSlug, hideChildren),
            apiSection: async (value) => this.toApiSectionNode(value, parentSlug, hideChildren),
            section: async (value) => this.toSectionNode(prefix, value, parentSlug, hideChildren),
            link: async (value) => this.toLinkNode(value),
            changelog: async (value) => this.toChangelogNode(value, parentSlug, hideChildren)
        });
    }

    private async toApiSectionNode(
        item: docsYml.DocsNavigationItem.ApiSection,
        parentSlug: FernNavigation.V1.SlugGenerator,
        hideChildren?: boolean
    ): Promise<FernNavigation.V1.ApiReferenceNode> {
        if (item.openrpc != null) {
            const absoluteFilepathToOpenrpc = resolve(
                this.docsWorkspace.absoluteFilePath,
                RelativeFilePath.of(item.openrpc)
            );
            if (!(await doesPathExist(absoluteFilepathToOpenrpc))) {
                throw new Error(`OpenRPC file does not exist at path: ${absoluteFilepathToOpenrpc}`);
            }
            const api = await generateFdrFromOpenrpc(absoluteFilepathToOpenrpc, this.taskContext);
            if (api == null) {
                throw new Error("Failed to generate API Definition from OpenRPC document");
            }
            await this.registerApiV2({
                // biome-ignore lint/suspicious/noExplicitAny: allow explicit any
                api: api as any,
                apiName: item.apiName,
                snippetsConfig: convertDocsSnippetsConfigToFdr(item.snippetsConfiguration)
            });
            const node = new ApiReferenceNodeConverterLatest(
                item,
                // biome-ignore lint/suspicious/noExplicitAny: allow explicit any
                api as any,
                parentSlug,
                undefined,
                this.docsWorkspace,
                this.taskContext,
                this.markdownFilesToFullSlugs,
                this.markdownFilesToNoIndex,
                this.#idgen,
                hideChildren
            );
            return node.get();
        }

        if (this.parsedDocsConfig.experimental?.openapiParserV2) {
            const workspace = this.getOpenApiWorkspaceForApiSection(item);
            const snippetsConfig = convertDocsSnippetsConfigToFdr(item.snippetsConfiguration);
            const api = await generateFdrFromOpenApiWorkspace(workspace, this.taskContext);
            if (api == null) {
                throw new Error("Failed to generate API Definition from OpenAPI workspace");
            }
            await this.registerApiV2({
                // biome-ignore lint/suspicious/noExplicitAny: allow explicit any
                api: api as any,
                snippetsConfig,
                apiName: item.apiName
            });
            const node = new ApiReferenceNodeConverterLatest(
                item,
                // biome-ignore lint/suspicious/noExplicitAny: allow explicit any
                api as any,
                parentSlug,
                workspace,
                this.docsWorkspace,
                this.taskContext,
                this.markdownFilesToFullSlugs,
                this.markdownFilesToNoIndex,
                this.#idgen,
                hideChildren
            );
            return node.get();
        }

        const snippetsConfig = convertDocsSnippetsConfigToFdr(item.snippetsConfiguration);

        let ir: IntermediateRepresentation | undefined = undefined;
        let workspace: FernWorkspace | undefined = undefined;
        const openapiParserV3 = this.parsedDocsConfig.experimental?.openapiParserV3;
        const useV3Parser = openapiParserV3 == null || openapiParserV3;
        // The v3 parser is enabled on default. We attempt to load the OpenAPI workspace and generate an IR directly.
        if (useV3Parser) {
            try {
                const openapiWorkspace = this.getOpenApiWorkspaceForApiSection(item);
                ir = await openapiWorkspace.getIntermediateRepresentation({
                    context: this.taskContext,
                    audiences: item.audiences,
                    enableUniqueErrorsPerEndpoint: true,
                    generateV1Examples: false
                });
            } catch (error) {
                // noop
            }
        }
        // This case runs if either the V3 parser is not enabled, or if we failed to load the OpenAPI workspace
        if (ir == null) {
            workspace = await this.getFernWorkspaceForApiSection(item).toFernWorkspace(
                { context: this.taskContext },
                {
                    enableUniqueErrorsPerEndpoint: true,
                    detectGlobalHeaders: false,
                    objectQueryParameters: true,
                    preserveSchemaIds: true
                }
            );
            ir = generateIntermediateRepresentation({
                workspace,
                audiences: item.audiences,
                generationLanguage: undefined,
                keywords: undefined,
                smartCasing: false,
                exampleGeneration: { disabled: false, skipAutogenerationIfManualExamplesExist: true },
                readme: undefined,
                version: undefined,
                packageName: undefined,
                context: this.taskContext,
                sourceResolver: new SourceResolverImpl(this.taskContext, workspace)
            });
        }

        const apiDefinitionId = await this.registerApi({
            ir,
            snippetsConfig,
            playgroundConfig: { oauth: item.playground?.oauth },
            apiName: item.apiName
        });
        const api = convertIrToApiDefinition(ir, apiDefinitionId, { oauth: item.playground?.oauth });

        const node = new ApiReferenceNodeConverter(
            item,
            api,
            parentSlug,
            this.docsWorkspace,
            this.taskContext,
            this.markdownFilesToFullSlugs,
            this.markdownFilesToNoIndex,
            this.#idgen,
            workspace,
            hideChildren
        );
        return node.get();
    }

    private async toChangelogNode(
        item: docsYml.DocsNavigationItem.Changelog,
        parentSlug: FernNavigation.V1.SlugGenerator,
        hideChildren?: boolean
    ): Promise<FernNavigation.V1.ChangelogNode> {
        const changelogResolver = new ChangelogNodeConverter(
            this.markdownFilesToFullSlugs,
            this.markdownFilesToNoIndex,
            item.changelog,
            this.docsWorkspace,
            this.#idgen
        );

        return changelogResolver.toChangelogNode({
            parentSlug,
            title: item.title,
            icon: item.icon,
            viewers: item.viewers,
            hidden: hideChildren || item.hidden,
            slug: item.slug
        });
    }

    private async toLinkNode(item: docsYml.DocsNavigationItem.Link): Promise<FernNavigation.V1.LinkNode> {
        return {
            type: "link",
            id: this.#idgen.get(item.url),
            title: item.text,
            url: FernNavigation.V1.Url(item.url),
            icon: item.icon
        };
    }

    private async toPageNode(
        item: docsYml.DocsNavigationItem.Page,
        parentSlug: FernNavigation.V1.SlugGenerator,
        hideChildren?: boolean
    ): Promise<FernNavigation.V1.PageNode> {
        const pageId = FernNavigation.PageId(this.toRelativeFilepath(item.absolutePath));
        const slug = parentSlug.apply({
            urlSlug: item.slug ?? kebabCase(item.title),
            fullSlug: this.markdownFilesToFullSlugs.get(item.absolutePath)?.split("/")
        });
        const id = this.#idgen.get(pageId);
        return {
            id,
            type: "page",
            slug: slug.get(),
            title: item.title,
            icon: item.icon,
            hidden: hideChildren || item.hidden,
            viewers: item.viewers,
            orphaned: item.orphaned,
            pageId,
            authed: undefined,
            noindex: item.noindex || this.markdownFilesToNoIndex.get(item.absolutePath),
            featureFlags: item.featureFlags
        };
    }

    private async toSectionNode(
        prefix: string,
        item: docsYml.DocsNavigationItem.Section,
        parentSlug: FernNavigation.V1.SlugGenerator,
        hideChildren?: boolean
    ): Promise<FernNavigation.V1.SectionNode> {
        const relativeFilePath = this.toRelativeFilepath(item.overviewAbsolutePath);
        const pageId = relativeFilePath ? FernNavigation.PageId(relativeFilePath) : undefined;
        const id = this.#idgen.get(pageId ?? `${prefix}/section`);
        const slug = parentSlug.apply({
            urlSlug: item.slug ?? kebabCase(item.title),
            fullSlug: item.overviewAbsolutePath
                ? this.markdownFilesToFullSlugs.get(item.overviewAbsolutePath)?.split("/")
                : undefined,
            skipUrlSlug: item.skipUrlSlug
        });
        const noindex =
            item.overviewAbsolutePath != null ? this.markdownFilesToNoIndex.get(item.overviewAbsolutePath) : undefined;
        const hiddenSection = hideChildren || item.hidden;
        return {
            id,
            type: "section",
            overviewPageId: pageId,
            slug: slug.get(),
            title: item.title,
            icon: item.icon,
            collapsed: item.collapsed,
            hidden: hiddenSection,
            viewers: item.viewers,
            orphaned: item.orphaned,
            children: await Promise.all(
                item.contents.map((child) => this.toNavigationChild(id, child, slug, hiddenSection))
            ),
            authed: undefined,
            pointsTo: undefined,
            noindex,
            featureFlags: item.featureFlags
        };
    }

    private async convertTabbedNavigation(
        prefix: string,
        items: docsYml.TabbedNavigation[],
        parentSlug: FernNavigation.V1.SlugGenerator
    ): Promise<FernNavigation.V1.TabbedNode> {
        const id = this.#idgen.get(`${prefix}/tabbed`);
        return {
            type: "tabbed",
            id,
            children: await Promise.all(items.map((item) => this.toTabChild(id, item, parentSlug)))
        };
    }

    private async toTabChild(
        prefix: string,
        item: docsYml.TabbedNavigation,
        parentSlug: FernNavigation.V1.SlugGenerator
    ): Promise<FernNavigation.V1.TabChild> {
        return visitDiscriminatedUnion(item.child)._visit<Promise<FernNavigation.V1.TabChild>>({
            link: ({ href }) => this.toTabLinkNode(item, href),
            layout: ({ layout }) => this.toTabNode(prefix, item, layout, parentSlug),
            changelog: ({ changelog }) => this.toTabChangelogNode(item, changelog, parentSlug)
        });
    }

    private async toTabChangelogNode(
        item: docsYml.TabbedNavigation,
        changelog: AbsoluteFilePath[],
        parentSlug: FernNavigation.V1.SlugGenerator
    ): Promise<FernNavigation.V1.ChangelogNode> {
        const changelogResolver = new ChangelogNodeConverter(
            this.markdownFilesToFullSlugs,
            this.markdownFilesToNoIndex,
            changelog,
            this.docsWorkspace,
            this.#idgen
        );
        return changelogResolver.toChangelogNode({
            parentSlug,
            title: item.title,
            icon: item.icon,
            viewers: item.viewers,
            hidden: item.hidden,
            slug: item.slug
        });
    }

    private async toTabLinkNode(item: docsYml.TabbedNavigation, href: string): Promise<FernNavigation.V1.LinkNode> {
        return {
            type: "link",
            id: this.#idgen.get(href),
            title: item.title,
            url: FernNavigation.V1.Url(href),
            icon: item.icon
        };
    }

    private async toTabNode(
        prefix: string,
        item: docsYml.TabbedNavigation,
        layout: docsYml.DocsNavigationItem[],
        parentSlug: FernNavigation.V1.SlugGenerator
    ): Promise<FernNavigation.V1.TabNode> {
        const id = this.#idgen.get(`${prefix}/tab`);
        const slug = parentSlug.apply({
            urlSlug: item.slug ?? kebabCase(item.title),
            skipUrlSlug: item.skipUrlSlug
        });
        return {
            type: "tab",
            id,
            title: item.title,
            slug: slug.get(),
            icon: item.icon,
            hidden: item.hidden,
            authed: undefined,
            viewers: item.viewers,
            orphaned: item.orphaned,
            pointsTo: undefined,
            child: await this.toSidebarRootNode(id, layout, slug),
            featureFlags: item.featureFlags
        };
    }

    private getFileId(filepath: AbsoluteFilePath): DocsV1Write.FileId;
    private getFileId(filepath: AbsoluteFilePath | undefined): DocsV1Write.FileId | undefined;
    private getFileId(filepath: AbsoluteFilePath | undefined): DocsV1Write.FileId | undefined {
        if (filepath == null) {
            return undefined;
        }
        const fileId = this.collectedFileIds.get(filepath);
        if (fileId == null) {
            return this.taskContext.failAndThrow("Failed to locate file after uploading: " + filepath);
        }
        return DocsV1Write.FileId(fileId);
    }

    private convertColorConfigImageReferences(): DocsV1Write.ColorsConfigV3 | undefined {
        const { colors } = this.parsedDocsConfig;
        if (colors == null) {
            return undefined;
        }
        if (colors.type === "dark") {
            return {
                ...colors,
                ...this.convertLogoAndBackgroundImage({
                    theme: "dark"
                })
            };
        } else if (colors.type === "light") {
            return {
                ...colors,
                ...this.convertLogoAndBackgroundImage({
                    theme: "light"
                }),
                type: "light"
            };
        } else {
            return {
                ...colors,
                dark: {
                    ...colors.dark,
                    ...this.convertLogoAndBackgroundImage({
                        theme: "dark"
                    })
                },
                light: {
                    ...colors.light,
                    ...this.convertLogoAndBackgroundImage({
                        theme: "light"
                    })
                }
            };
        }
    }

    private convertLogoAndBackgroundImage({ theme }: { theme: "dark" | "light" }) {
        const { logo, backgroundImage } = this.parsedDocsConfig;
        const logoRef = logo?.[theme];
        const backgroundImageRef = backgroundImage?.[theme];
        return {
            logo: this.getFileId(logoRef),
            backgroundImage: this.getFileId(backgroundImageRef)
        };
    }

    private convertDocsTypographyConfiguration(): DocsV1Write.DocsTypographyConfigV2 | undefined {
        if (this.parsedDocsConfig.typography == null) {
            return;
        }
        return {
            headingsFont: this.convertFont(this.parsedDocsConfig.typography.headingsFont, "headings"),
            bodyFont: this.convertFont(this.parsedDocsConfig.typography.bodyFont, "body"),
            codeFont: this.convertFont(this.parsedDocsConfig.typography.codeFont, "code")
        };
    }

    private convertFont(font: docsYml.FontConfig | undefined, label: string): DocsV1Write.FontConfigV2 | undefined {
        if (font == null) {
            return;
        }

        if (font.variants[0] == null) {
            return;
        }

        const fileId = this.getFileId(font.variants[0].absolutePath);

        return {
            type: "custom",
            name: font.name ?? `font:${label}:${fileId}`,
            variants: font.variants.map((variant) => {
                const fontFile = this.getFileId(variant.absolutePath);
                return {
                    fontFile,
                    weight: variant.weight,
                    style: variant.style != null ? [variant.style] : undefined
                };
            }),
            display: font.display,
            fallback: font.fallback,
            fontVariationSettings: font.fontVariationSettings
        };
    }

    private convertJavascriptConfiguration(): DocsV1Write.JsConfig | undefined {
        if (this.parsedDocsConfig.js == null) {
            return;
        }
        return {
            files: this.parsedDocsConfig.js.files
                .map(({ absolutePath, strategy }) => ({
                    fileId: this.getFileId(absolutePath),
                    strategy
                }))
                .filter(isNonNullish),
            remote: this.parsedDocsConfig.js.remote?.map((remote) => ({
                ...remote,
                url: DocsV1Write.Url(remote.url)
            })),
            inline: undefined
        };
    }

    private convertMetadata(): DocsV1Write.MetadataConfig | undefined {
        if (this.parsedDocsConfig.metadata == null) {
            return;
        }

        const {
            "og:image": ogImage,
            "og:logo": ogLogo,
            "twitter:image": twitterImage,
            ...rest
        } = this.parsedDocsConfig.metadata;
        return {
            ...rest,
            "og:image": this.convertFileIdOrUrl(ogImage),
            "og:logo": this.convertFileIdOrUrl(ogLogo),
            "twitter:image": this.convertFileIdOrUrl(twitterImage)
        };
    }

    private convertFileIdOrUrl(filepathOrUrl: docsYml.FilepathOrUrl | undefined): DocsV1Write.FileIdOrUrl | undefined {
        if (filepathOrUrl == null) {
            return;
        }

        return visitDiscriminatedUnion(filepathOrUrl, "type")._visit<DocsV1Write.FileIdOrUrl>({
            filepath: ({ value }) => ({
                type: "fileId",
                value: this.getFileId(value)
            }),
            url: ({ value }) => ({ type: "url", value: DocsV1Write.Url(value) }),
            _other: () => this.taskContext.failAndThrow("Invalid metadata configuration")
        });
    }
}

function createEditThisPageUrl(
    editThisPage: docsYml.RawSchemas.FernDocsConfig.EditThisPageConfig | undefined,
    pageFilepath: string
): string | undefined {
    if (editThisPage?.github == null) {
        return undefined;
    }

    const { owner, repo, branch = "main", host = "https://github.com" } = editThisPage.github;

    return `${wrapWithHttps(host)}/${owner}/${repo}/blob/${branch}/fern/${pageFilepath}?plain=1`;
}

function convertAvailability(
    availability: docsYml.RawSchemas.VersionAvailability
): FernNavigation.V1.NavigationV1Availability {
    switch (availability) {
        case "beta":
            return FernNavigation.V1.NavigationV1Availability.Beta;
        case "deprecated":
            return FernNavigation.V1.NavigationV1Availability.Deprecated;
        case "ga":
            return FernNavigation.V1.NavigationV1Availability.GenerallyAvailable;
        case "stable":
            return FernNavigation.V1.NavigationV1Availability.Stable;
        default:
            assertNever(availability);
    }
}
