import {
    CoreUtilities,
    ExportsManager,
    ImportsManager,
    Reference,
    TypeReferenceNode,
    Zurg
} from "@fern-typescript/commons";
import { BaseContext, GeneratedTypeSchema, TypeSchemaContext } from "@fern-typescript/contexts";
import { TypeGenerator } from "@fern-typescript/type-generator";
import {
    TypeReferenceToRawTypeNodeConverter,
    TypeReferenceToSchemaConverter
} from "@fern-typescript/type-reference-converters";
import { TypeSchemaGenerator } from "@fern-typescript/type-schema-generator";
import { SourceFile, ts } from "ts-morph";

import { DeclaredTypeName, ShapeType, TypeReference } from "@fern-fern/ir-sdk/api";

import { TypeDeclarationReferencer } from "../../declaration-referencers/TypeDeclarationReferencer";
import { getSchemaImportStrategy } from "../getSchemaImportStrategy";

export declare namespace TypeSchemaContextImpl {
    export interface Init {
        sourceFile: SourceFile;
        coreUtilities: CoreUtilities;
        importsManager: ImportsManager;
        exportsManager: ExportsManager;
        context: BaseContext;
        typeDeclarationReferencer: TypeDeclarationReferencer;
        typeSchemaDeclarationReferencer: TypeDeclarationReferencer;
        typeGenerator: TypeGenerator;
        typeSchemaGenerator: TypeSchemaGenerator;
        treatUnknownAsAny: boolean;
        includeSerdeLayer: boolean;
        retainOriginalCasing: boolean;
        useBigInt: boolean;
        enableInlineTypes: boolean;
        allowExtraFields: boolean;
        omitUndefined: boolean;
    }
}

export class TypeSchemaContextImpl implements TypeSchemaContext {
    private sourceFile: SourceFile;
    private coreUtilities: CoreUtilities;
    private importsManager: ImportsManager;
    private exportsManager: ExportsManager;
    private typeDeclarationReferencer: TypeDeclarationReferencer;
    private typeSchemaDeclarationReferencer: TypeDeclarationReferencer;
    private typeReferenceToRawTypeNodeConverter: TypeReferenceToRawTypeNodeConverter;
    private typeReferenceToSchemaConverter: TypeReferenceToSchemaConverter;
    private context: BaseContext;
    private typeGenerator: TypeGenerator;
    private typeSchemaGenerator: TypeSchemaGenerator;
    private includeSerdeLayer: boolean;
    private retainOriginalCasing: boolean;

    constructor({
        sourceFile,
        coreUtilities,
        importsManager,
        exportsManager,
        context,
        typeDeclarationReferencer,
        typeGenerator,
        typeSchemaDeclarationReferencer,
        typeSchemaGenerator,
        treatUnknownAsAny,
        includeSerdeLayer,
        retainOriginalCasing,
        useBigInt,
        enableInlineTypes,
        allowExtraFields,
        omitUndefined
    }: TypeSchemaContextImpl.Init) {
        this.sourceFile = sourceFile;
        this.coreUtilities = coreUtilities;
        this.importsManager = importsManager;
        this.exportsManager = exportsManager;
        this.typeReferenceToRawTypeNodeConverter = new TypeReferenceToRawTypeNodeConverter({
            getReferenceToNamedType: (typeName) => this.getReferenceToRawNamedType(typeName).getEntityName(),
            generateForInlineUnion: (typeName) => this.generateForInlineUnion(typeName),
            context,
            treatUnknownAsAny,
            includeSerdeLayer,
            useBigInt,
            enableInlineTypes,
            allowExtraFields,
            omitUndefined
        });
        this.typeReferenceToSchemaConverter = new TypeReferenceToSchemaConverter({
            getSchemaOfNamedType: (typeName) => this.getSchemaOfNamedType(typeName, { isGeneratingSchema: true }),
            zurg: this.coreUtilities.zurg,
            context,
            treatUnknownAsAny,
            includeSerdeLayer,
            useBigInt,
            enableInlineTypes,
            allowExtraFields,
            omitUndefined
        });
        this.typeDeclarationReferencer = typeDeclarationReferencer;
        this.typeSchemaDeclarationReferencer = typeSchemaDeclarationReferencer;
        this.context = context;
        this.typeGenerator = typeGenerator;
        this.typeSchemaGenerator = typeSchemaGenerator;
        this.includeSerdeLayer = includeSerdeLayer;
        this.retainOriginalCasing = retainOriginalCasing;
    }

    public getGeneratedTypeSchema(typeName: DeclaredTypeName): GeneratedTypeSchema {
        const typeDeclaration = this.context.type.getTypeDeclaration(typeName);
        const examples = typeDeclaration.userProvidedExamples;
        if (examples.length === 0) {
            examples.push(...typeDeclaration.autogeneratedExamples);
        }

        return this.typeSchemaGenerator.generateTypeSchema({
            shape: typeDeclaration.shape,
            typeName: this.typeSchemaDeclarationReferencer.getExportedName(typeDeclaration.name),
            getGeneratedType: () =>
                this.typeGenerator.generateType({
                    shape: typeDeclaration.shape,
                    docs: typeDeclaration.docs ?? undefined,
                    examples,
                    fernFilepath: typeDeclaration.name.fernFilepath,
                    typeName: this.typeDeclarationReferencer.getExportedName(typeDeclaration.name),
                    getReferenceToSelf: (context) => context.type.getReferenceToNamedType(typeName),
                    includeSerdeLayer: this.includeSerdeLayer,
                    retainOriginalCasing: this.retainOriginalCasing,
                    inline: typeDeclaration.inline ?? false
                }),
            getReferenceToGeneratedType: () =>
                this.typeDeclarationReferencer
                    .getReferenceToType({
                        name: typeDeclaration.name,
                        importsManager: this.importsManager,
                        exportsManager: this.exportsManager,
                        referencedIn: this.sourceFile,
                        importStrategy: {
                            type: "fromRoot",
                            namespaceImport: this.typeDeclarationReferencer.namespaceExport
                        }
                    })
                    .getTypeNode(),
            getReferenceToGeneratedTypeSchema: () =>
                this.typeSchemaDeclarationReferencer.getReferenceToType({
                    name: typeDeclaration.name,
                    importsManager: this.importsManager,
                    exportsManager: this.exportsManager,
                    referencedIn: this.sourceFile,
                    importStrategy: getSchemaImportStrategy({ useDynamicImport: false })
                })
        });
    }

    public getReferenceToRawType(typeReference: TypeReference): TypeReferenceNode {
        return this.typeReferenceToRawTypeNodeConverter.convert({ typeReference });
    }

    public getReferenceToRawNamedType(typeName: DeclaredTypeName): Reference {
        return this.typeSchemaDeclarationReferencer.getReferenceToType({
            name: typeName,
            importStrategy: getSchemaImportStrategy({
                // dynamic import not needed for types
                useDynamicImport: false
            }),
            // TODO this should not be hardcoded here
            subImport: ["Raw"],
            importsManager: this.importsManager,
            exportsManager: this.exportsManager,
            referencedIn: this.sourceFile
        });
    }

    private generateForInlineUnion(typeName: DeclaredTypeName): ts.TypeNode {
        throw new Error("Inline unions are not supported in Express Schemas");
    }

    public getSchemaOfTypeReference(typeReference: TypeReference): Zurg.Schema {
        return this.typeReferenceToSchemaConverter.convert({ typeReference });
    }

    public getSchemaOfNamedType(
        typeName: DeclaredTypeName,
        { isGeneratingSchema }: { isGeneratingSchema: boolean }
    ): Zurg.Schema {
        const referenceToSchema = this.typeSchemaDeclarationReferencer
            .getReferenceToType({
                name: typeName,
                importStrategy: getSchemaImportStrategy({
                    useDynamicImport: false
                }),
                importsManager: this.importsManager,
                exportsManager: this.exportsManager,
                referencedIn: this.sourceFile
            })
            .getExpression();

        let schema = this.coreUtilities.zurg.Schema._fromExpression(referenceToSchema);

        // when generating schemas, wrap named types with lazy() to prevent issues with circular imports
        if (isGeneratingSchema) {
            schema = this.wrapSchemaWithLazy(schema, typeName);
        }

        return schema;
    }

    private wrapSchemaWithLazy(schema: Zurg.Schema, typeName: DeclaredTypeName): Zurg.Schema {
        const resolvedType = this.context.type.resolveTypeName(typeName);
        return resolvedType.type === "named" && resolvedType.shape === ShapeType.Object
            ? this.coreUtilities.zurg.lazyObject(schema)
            : this.coreUtilities.zurg.lazy(schema);
    }
}
