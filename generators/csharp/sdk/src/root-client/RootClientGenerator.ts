import { assertNever } from "@fern-api/core-utils";
import { CSharpFile, FileGenerator } from "@fern-api/csharp-base";
import { csharp, escapeForCSharpString } from "@fern-api/csharp-codegen";
import { RelativeFilePath, join } from "@fern-api/fs-utils";

import {
    AuthScheme,
    HttpHeader,
    Literal,
    OAuthScheme,
    PrimitiveTypeV1,
    PrimitiveTypeV2,
    ServiceId,
    Subpackage,
    TypeReference
} from "@fern-fern/ir-sdk/api";

import { SdkCustomConfigSchema } from "../SdkCustomConfig";
import { SdkGeneratorContext } from "../SdkGeneratorContext";
import { RawClient } from "../endpoint/http/RawClient";
import { GrpcClientInfo } from "../grpc/GrpcClientInfo";
import { OauthTokenProviderGenerator } from "../oauth/OauthTokenProviderGenerator";

export const CLIENT_MEMBER_NAME = "_client";
export const GRPC_CLIENT_MEMBER_NAME = "_grpc";

const GetFromEnvironmentOrThrow = "GetFromEnvironmentOrThrow";
const CLIENT_OPTIONS_PARAMETER_NAME = "clientOptions";

interface ConstructorParameter {
    name: string;
    docs?: string;
    isOptional: boolean;
    typeReference: TypeReference;
    /**
     * The header associated with this parameter
     */
    header?: HeaderInfo;
    environmentVariable?: string;
}

interface LiteralParameter {
    name: string;
    value: Literal;
    header?: HeaderInfo;
}

interface HeaderInfo {
    name: string;
    prefix?: string;
}

export class RootClientGenerator extends FileGenerator<CSharpFile, SdkCustomConfigSchema, SdkGeneratorContext> {
    private rawClient: RawClient;
    private serviceId: ServiceId | undefined;
    private grpcClientInfo: GrpcClientInfo | undefined;
    private oauth: OAuthScheme | undefined;

    constructor(context: SdkGeneratorContext) {
        super(context);
        this.oauth = context.getOauth();
        this.rawClient = new RawClient(context);
        this.serviceId = this.context.ir.rootPackage.service;
        this.grpcClientInfo =
            this.serviceId != null ? this.context.getGrpcClientInfoForServiceId(this.serviceId) : undefined;
    }

    protected getFilepath(): RelativeFilePath {
        return join(RelativeFilePath.of(this.context.getRootClientClassName() + ".cs"));
    }

    public doGenerate(): CSharpFile {
        const class_ = csharp.class_({
            ...this.context.getRootClientClassReference(),
            partial: true,
            access: this.context.getRootClientAccess()
        });

        class_.addField(
            csharp.field({
                access: csharp.Access.Private,
                name: CLIENT_MEMBER_NAME,
                type: csharp.Type.reference(this.context.getRawClientClassReference()),
                readonly: true
            })
        );

        if (this.grpcClientInfo != null) {
            class_.addField(
                csharp.field({
                    access: csharp.Access.Private,
                    name: GRPC_CLIENT_MEMBER_NAME,
                    type: csharp.Type.reference(this.context.getRawGrpcClientClassReference()),
                    readonly: true
                })
            );

            class_.addField(
                csharp.field({
                    access: csharp.Access.Private,
                    name: this.grpcClientInfo.privatePropertyName,
                    type: csharp.Type.reference(this.grpcClientInfo.classReference)
                })
            );
        }

        class_.addConstructor(this.getConstructorMethod());

        for (const subpackage of this.getSubpackages()) {
            // skip subpackages that have no endpoints (recursively)
            if (!this.context.subPackageHasEndpoints(subpackage)) {
                continue;
            }
            class_.addField(
                csharp.field({
                    access: csharp.Access.Public,
                    get: true,
                    name: subpackage.name.pascalCase.safeName,
                    type: csharp.Type.reference(this.context.getSubpackageClassReference(subpackage))
                })
            );
        }

        const rootServiceId = this.context.ir.rootPackage.service;
        if (rootServiceId != null) {
            const service = this.context.getHttpServiceOrThrow(rootServiceId);
            const methods = service.endpoints.flatMap((endpoint) => {
                return this.context.endpointGenerator.generate({
                    serviceId: rootServiceId,
                    endpoint,
                    rawClientReference: CLIENT_MEMBER_NAME,
                    rawClient: this.rawClient,
                    rawGrpcClientReference: GRPC_CLIENT_MEMBER_NAME,
                    grpcClientInfo: this.grpcClientInfo
                });
            });
            class_.addMethods(methods);
        }

        const { optionalParameters } = this.getConstructorParameters();
        if (optionalParameters.some((parameter) => parameter.environmentVariable != null)) {
            class_.addMethod(this.getFromEnvironmentOrThrowMethod());
        }
        return new CSharpFile({
            clazz: class_,
            directory: RelativeFilePath.of(""),
            allNamespaceSegments: this.context.getAllNamespaceSegments(),
            allTypeClassReferences: this.context.getAllTypeClassReferences(),
            namespace: this.context.getNamespace(),
            customConfig: this.context.customConfig
        });
    }

    private getConstructorMethod(): csharp.Class.Constructor {
        const { requiredParameters, optionalParameters, literalParameters } = this.getConstructorParameters();
        const parameters: csharp.Parameter[] = [];
        for (const param of requiredParameters) {
            parameters.push(
                csharp.parameter({
                    name: param.name,
                    type: this.context.csharpTypeMapper.convert({ reference: param.typeReference }),
                    docs: param.docs
                })
            );
        }
        for (const param of optionalParameters) {
            parameters.push(
                csharp.parameter({
                    name: param.name,
                    type: this.context.csharpTypeMapper
                        .convert({ reference: param.typeReference })
                        .toOptionalIfNotAlready(),
                    docs: param.docs,
                    initializer: "null"
                })
            );
        }

        parameters.push(
            csharp.parameter({
                name: CLIENT_OPTIONS_PARAMETER_NAME,
                type: csharp.Type.optional(csharp.Type.reference(this.context.getClientOptionsClassReference())),
                initializer: "null"
            })
        );

        const headerEntries: csharp.Dictionary.MapEntry[] = [];
        for (const param of [...requiredParameters, ...optionalParameters]) {
            if (param.header != null) {
                headerEntries.push({
                    key: csharp.codeblock(csharp.string_({ string: param.header.name })),
                    value: csharp.codeblock(
                        param.header.prefix != null ? `$"${param.header.prefix} {${param.name}}"` : param.name
                    )
                });
            }
        }

        for (const param of literalParameters) {
            if (param.header != null) {
                headerEntries.push({
                    key: csharp.codeblock(csharp.string_({ string: param.header.name })),
                    value: csharp.codeblock(
                        param.value.type === "string"
                            ? csharp.string_({ string: param.value.string })
                            : param.value
                              ? `"${true.toString()}"`
                              : `"${false.toString()}"`
                    )
                });
            }
        }

        const platformHeaders = this.context.ir.sdkConfig.platformHeaders;
        headerEntries.push({
            key: csharp.codeblock(`"${platformHeaders.language}"`),
            value: csharp.codeblock('"C#"')
        });
        headerEntries.push({
            key: csharp.codeblock(`"${platformHeaders.sdkName}"`),
            value: csharp.codeblock(`"${this.context.getNamespace()}"`)
        });
        headerEntries.push({
            key: csharp.codeblock(`"${platformHeaders.sdkVersion}"`),
            value: this.context.getCurrentVersionValueAccess()
        });
        if (platformHeaders.userAgent != null) {
            headerEntries.push({
                key: csharp.codeblock(`"${platformHeaders.userAgent.header}"`),
                value: csharp.codeblock(`"${platformHeaders.userAgent.value}"`)
            });
        }
        const headerDictionary = csharp.dictionary({
            keyType: csharp.Types.string(),
            valueType: csharp.Types.string(),
            values: {
                type: "entries",
                entries: headerEntries
            }
        });

        return {
            access: csharp.Access.Public,
            parameters,
            body: csharp.codeblock((writer) => {
                for (const param of optionalParameters) {
                    if (param.environmentVariable != null) {
                        writer.writeLine(`${param.name} ??= ${GetFromEnvironmentOrThrow}(`);
                        writer.indent();
                        writer.writeNode(csharp.string_({ string: param.environmentVariable }));
                        writer.writeLine(",");
                        writer.writeLine(
                            `"Please pass in ${escapeForCSharpString(param.name)} or set the environment variable ${escapeForCSharpString(param.environmentVariable)}."`
                        );
                        writer.dedent();
                        writer.writeLine(");");
                    }
                }
                writer.write("var defaultHeaders = ");
                writer.writeNodeStatement(
                    csharp.instantiateClass({
                        classReference: this.context.getHeadersClassReference(),
                        arguments_: [headerDictionary]
                    })
                );

                writer.write("clientOptions ??= ");
                writer.writeNodeStatement(
                    csharp.instantiateClass({
                        classReference: this.context.getClientOptionsClassReference(),
                        arguments_: []
                    })
                );

                for (const param of literalParameters) {
                    if (param.header != null) {
                        writer.controlFlow("if", csharp.codeblock(`clientOptions.${param.name} != null`));
                        writer.write(`defaultHeaders["${param.header.name}"] = `);
                        if (param.value.type === "string") {
                            writer.write(`clientOptions.${param.name}`);
                        } else {
                            writer.write(`clientOptions.${param.name}.ToString()`);
                        }
                        writer.writeLine(";");
                        writer.endControlFlow();
                    }
                }

                writer.controlFlow("foreach", csharp.codeblock("var header in defaultHeaders"));
                writer.controlFlow("if", csharp.codeblock("!clientOptions.Headers.ContainsKey(header.Key)"));
                writer.writeLine("clientOptions.Headers[header.Key] = header.Value;");
                writer.endControlFlow();
                writer.endControlFlow();

                if (this.oauth != null) {
                    const authClientClassReference = this.context.getSubpackageClassReferenceForServiceIdOrThrow(
                        this.oauth.configuration.tokenEndpoint.endpointReference.serviceId
                    );
                    const arguments_ = [csharp.codeblock("new RawClient(clientOptions.Clone())")];
                    writer.write("var tokenProvider = new OAuthTokenProvider(clientId, clientSecret, ");
                    writer.writeNode(
                        csharp.instantiateClass({
                            classReference: authClientClassReference,
                            arguments_,
                            forceUseConstructor: true
                        })
                    );
                    writer.writeTextStatement(")");

                    writer.writeNode(
                        csharp.codeblock((writer) => {
                            writer.write(
                                `clientOptions.Headers["Authorization"] = new Func<string>( () => tokenProvider.${OauthTokenProviderGenerator.GET_ACCESS_TOKEN_ASYNC_METHOD_NAME}().Result );`
                            );
                        })
                    );
                }

                writer.writeLine("_client = ");
                writer.writeNodeStatement(
                    csharp.instantiateClass({
                        classReference: this.context.getRawClientClassReference(),
                        arguments_: [csharp.codeblock("clientOptions")]
                    })
                );
                if (this.grpcClientInfo != null) {
                    writer.writeLine("_grpc = _client.Grpc");
                    writer.write(this.grpcClientInfo.privatePropertyName);
                    writer.write(" = ");
                    writer.writeNodeStatement(
                        csharp.instantiateClass({
                            classReference: this.grpcClientInfo.classReference,
                            arguments_: [csharp.codeblock("_grpc.Channel")]
                        })
                    );
                }
                const arguments_ = [csharp.codeblock("_client")];
                for (const subpackage of this.getSubpackages()) {
                    // skip subpackages that have no endpoints (recursively)
                    if (!this.context.subPackageHasEndpoints(subpackage)) {
                        continue;
                    }
                    writer.writeLine(`${subpackage.name.pascalCase.safeName} = `);
                    writer.writeNodeStatement(
                        csharp.instantiateClass({
                            classReference: this.context.getSubpackageClassReference(subpackage),
                            arguments_
                        })
                    );
                }
            })
        };
    }

    public generateExampleClientInstantiationSnippet({
        clientOptionsArgument,
        includeEnvVarArguments,
        asSnippet
    }: {
        clientOptionsArgument?: csharp.ClassInstantiation;
        includeEnvVarArguments?: boolean;
        asSnippet?: boolean;
    }): csharp.ClassInstantiation {
        const arguments_ = [];
        for (const header of this.context.ir.headers) {
            if (
                header.valueType.type === "container" &&
                (header.valueType.container.type === "optional" || header.valueType.container.type === "literal")
            ) {
                continue;
            }
            arguments_.push(csharp.codeblock(`"${header.name.name.screamingSnakeCase.safeName}"`));
        }
        if (this.context.ir.auth.requirement) {
            for (const scheme of this.context.ir.auth.schemes) {
                switch (scheme.type) {
                    case "header":
                        if (scheme.headerEnvVar == null || includeEnvVarArguments) {
                            // assuming type is string for now to avoid generating complex example types here.
                            arguments_.push(csharp.codeblock(`"${scheme.name.name.screamingSnakeCase.safeName}"`));
                        }
                        break;
                    case "basic": {
                        if (scheme.usernameEnvVar == null || includeEnvVarArguments) {
                            arguments_.push(csharp.codeblock(`"${scheme.username.screamingSnakeCase.safeName}"`));
                        }
                        if (scheme.passwordEnvVar == null || includeEnvVarArguments) {
                            arguments_.push(csharp.codeblock(`"${scheme.password.screamingSnakeCase.safeName}"`));
                        }
                        break;
                    }
                    case "bearer":
                        if (scheme.tokenEnvVar == null || includeEnvVarArguments) {
                            arguments_.push(csharp.codeblock(`"${scheme.token.screamingSnakeCase.safeName}"`));
                        }
                        break;
                    case "oauth": {
                        if (this.context.getOauth() != null) {
                            arguments_.push(csharp.codeblock('"CLIENT_ID"'));
                            arguments_.push(csharp.codeblock('"CLIENT_SECRET"'));
                        } else {
                            // default to bearer
                            arguments_.push(csharp.codeblock('"TOKEN"'));
                        }
                        break;
                    }
                }
            }
        }
        if (clientOptionsArgument != null) {
            arguments_.push(
                csharp.codeblock((writer) => {
                    writer.write(`${CLIENT_OPTIONS_PARAMETER_NAME}: `);
                    writer.writeNode(clientOptionsArgument);
                })
            );
        }
        return csharp.instantiateClass({
            classReference: asSnippet
                ? this.context.getRootClientClassReferenceForSnippets()
                : this.context.getRootClientClassReference(),
            arguments_
        });
    }

    private getConstructorParameters(authOnly = false): {
        allParameters: ConstructorParameter[];
        requiredParameters: ConstructorParameter[];
        optionalParameters: ConstructorParameter[];
        literalParameters: LiteralParameter[];
    } {
        const allParameters: ConstructorParameter[] = [];
        const requiredParameters: ConstructorParameter[] = [];
        const optionalParameters: ConstructorParameter[] = [];
        const literalParameters: LiteralParameter[] = [];

        for (const scheme of this.context.ir.auth.schemes) {
            allParameters.push(...this.getParameterFromAuthScheme(scheme));
        }
        for (const header of this.context.ir.headers) {
            allParameters.push(this.getParameterForHeader(header));
        }

        for (const param of allParameters) {
            if (param.isOptional || param.environmentVariable != null) {
                optionalParameters.push(param);
            } else if (param.typeReference.type === "container" && param.typeReference.container.type === "literal") {
                literalParameters.push({
                    name: param.name,
                    value: param.typeReference.container.literal,
                    header: param.header
                });
            } else {
                requiredParameters.push(param);
            }
        }
        return {
            allParameters,
            requiredParameters,
            optionalParameters,
            literalParameters
        };
    }

    private getParameterFromAuthScheme(scheme: AuthScheme): ConstructorParameter[] {
        const isOptional = this.context.ir.sdkConfig.isAuthMandatory;
        if (scheme.type === "header") {
            {
                const name = scheme.name.name.camelCase.safeName;
                return [
                    {
                        name,
                        docs: scheme.docs ?? `The ${name} to use for authentication.`,
                        isOptional,
                        header: {
                            name: scheme.name.wireValue,
                            prefix: scheme.prefix
                        },
                        typeReference: scheme.valueType,
                        environmentVariable: scheme.headerEnvVar
                    }
                ];
            }
        } else if (scheme.type === "bearer") {
            {
                const name = scheme.token.camelCase.safeName;
                return [
                    {
                        name,
                        docs: scheme.docs ?? `The ${name} to use for authentication.`,
                        isOptional,
                        header: {
                            name: "Authorization",
                            prefix: "Bearer"
                        },
                        typeReference: TypeReference.primitive({
                            v1: PrimitiveTypeV1.String,
                            v2: PrimitiveTypeV2.string({ default: undefined, validation: undefined })
                        }),
                        environmentVariable: scheme.tokenEnvVar
                    }
                ];
            }
        } else if (scheme.type === "basic") {
            {
                const usernameName = scheme.username.camelCase.safeName;
                const passwordName = scheme.password.camelCase.safeName;
                return [
                    {
                        name: usernameName,
                        docs: scheme.docs ?? `The ${usernameName} to use for authentication.`,
                        isOptional,
                        typeReference: TypeReference.primitive({
                            v1: PrimitiveTypeV1.String,
                            v2: PrimitiveTypeV2.string({ default: undefined, validation: undefined })
                        }),
                        environmentVariable: scheme.usernameEnvVar
                    },
                    {
                        name: passwordName,
                        docs: scheme.docs ?? `The ${passwordName} to use for authentication.`,
                        isOptional,
                        typeReference: TypeReference.primitive({
                            v1: PrimitiveTypeV1.String,
                            v2: PrimitiveTypeV2.string({ default: undefined, validation: undefined })
                        }),
                        environmentVariable: scheme.passwordEnvVar
                    }
                ];
            }
        } else if (this.oauth != null) {
            {
                return [
                    {
                        name: "clientId",
                        docs: "The clientId to use for authentication.",
                        isOptional,
                        typeReference: TypeReference.primitive({
                            v1: PrimitiveTypeV1.String,
                            v2: PrimitiveTypeV2.string({ default: undefined, validation: undefined })
                        }),
                        environmentVariable: scheme.configuration.clientIdEnvVar
                    },
                    {
                        name: "clientSecret",
                        docs: "The clientSecret to use for authentication.",
                        isOptional,
                        typeReference: TypeReference.primitive({
                            v1: PrimitiveTypeV1.String,
                            v2: PrimitiveTypeV2.string({ default: undefined, validation: undefined })
                        }),
                        environmentVariable: scheme.configuration.clientSecretEnvVar
                    }
                ];
            }
        } else if (scheme.type === "oauth") {
            return [];
        } else {
            assertNever(scheme);
        }
    }

    private getParameterForHeader(header: HttpHeader): ConstructorParameter {
        return {
            name:
                header.valueType.type === "container" && header.valueType.container.type === "literal"
                    ? header.name.name.pascalCase.safeName
                    : header.name.name.camelCase.safeName,
            header: {
                name: header.name.wireValue
            },
            docs: header.docs,
            isOptional: header.valueType.type === "container" && header.valueType.container.type === "optional",
            typeReference: header.valueType
        };
    }

    private getFromEnvironmentOrThrowMethod(): csharp.Method {
        return csharp.method({
            access: csharp.Access.Private,
            name: GetFromEnvironmentOrThrow,
            return_: csharp.Types.string(),
            parameters: [
                csharp.parameter({
                    name: "env",
                    type: csharp.Types.string()
                }),
                csharp.parameter({
                    name: "message",
                    type: csharp.Types.string()
                })
            ],
            isAsync: false,
            body: csharp.codeblock((writer) => {
                writer.writeLine("return Environment.GetEnvironmentVariable(env) ?? throw new Exception(message);");
            }),
            type: csharp.MethodType.STATIC
        });
    }

    private getSubpackages(): Subpackage[] {
        return this.context.ir.rootPackage.subpackages.map((subpackageId) => {
            return this.context.getSubpackageOrThrow(subpackageId);
        });
    }
}
