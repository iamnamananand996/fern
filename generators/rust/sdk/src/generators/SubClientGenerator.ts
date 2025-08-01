import { RelativeFilePath } from "@fern-api/fs-utils";
import { RustFile } from "@fern-api/rust-base";
import { UseStatement, rust } from "@fern-api/rust-codegen";
import { generateRustTypeForTypeReference } from "@fern-api/rust-model";

import { HttpEndpoint, HttpService, PrimitiveTypeV1, Subpackage, TypeReference } from "@fern-fern/ir-sdk/api";

import { SdkGeneratorContext } from "../SdkGeneratorContext";

interface EndpointParameter {
    name: string;
    type: rust.Type;
    isRef: boolean;
    optional: boolean;
}

export class SubClientGenerator {
    private readonly context: SdkGeneratorContext;
    private readonly subpackage: Subpackage;
    private readonly service?: HttpService;

    constructor(context: SdkGeneratorContext, subpackage: Subpackage) {
        this.context = context;
        this.subpackage = subpackage;
        this.service = subpackage.service ? this.context.getHttpServiceOrThrow(subpackage.service) : undefined;
    }

    // =============================================================================
    // PUBLIC API
    // =============================================================================

    public generate(): RustFile {
        const filename = `${this.subpackage.name.snakeCase.safeName}.rs`;
        const endpoints = this.service?.endpoints || [];

        const rustClient = rust.client({
            name: this.subClientName,
            fields: this.generateFields(),
            constructors: [this.generateConstructor()],
            methods: this.convertEndpointsToHttpMethods(endpoints)
        });

        const module = rust.module({
            useStatements: this.generateImports(),
            rawDeclarations: [rustClient.toString()]
        });

        return new RustFile({
            filename,
            directory: RelativeFilePath.of("src/client"),
            fileContents: module.toString()
        });
    }

    // =============================================================================
    // CLIENT STRUCTURE GENERATION
    // =============================================================================

    private get subClientName(): string {
        return this.subpackage.name.pascalCase.safeName + "Client";
    }

    private generateImports(): UseStatement[] {
        const hasTypes = this.hasTypes(this.context);
        const typesItems = [
            new UseStatement({
                path: "crate",
                items: ["ClientConfig", "ClientError", "HttpClient", "RequestOptions"]
            }),
            new UseStatement({
                path: "reqwest",
                items: ["Method"]
            })
        ];
        if (hasTypes) {
            typesItems.push(
                new UseStatement({
                    path: "crate",
                    items: ["types::*"]
                })
            );
        }
        return typesItems;
    }

    private generateFields(): rust.Client.Field[] {
        return [
            {
                name: "http_client",
                type: rust.Type.reference(rust.reference({ name: "HttpClient" })).toString(),
                visibility: "pub"
            }
        ];
    }

    private generateConstructor(): rust.Client.SimpleMethod {
        const configType = rust.Type.reference(rust.reference({ name: "ClientConfig" }));
        const selfType = rust.Type.reference(rust.reference({ name: "Self" }));
        const errorType = rust.Type.reference(rust.reference({ name: "ClientError" }));
        const returnType = rust.Type.result(selfType, errorType);

        return {
            name: "new",
            parameters: [`config: ${configType.toString()}`],
            returnType: returnType.toString(),
            isAsync: false,
            body: `let http_client = HttpClient::new(config)?;
        Ok(Self { http_client })`
        };
    }

    // =============================================================================
    // HTTP METHOD GENERATION
    // =============================================================================

    private convertEndpointsToHttpMethods(endpoints: HttpEndpoint[]): rust.Client.SimpleMethod[] {
        return endpoints.map((endpoint) => this.generateHttpMethod(endpoint));
    }

    private generateHttpMethod(endpoint: HttpEndpoint): rust.Client.SimpleMethod {
        const params = this.extractParametersFromEndpoint(endpoint);
        const parameters = this.buildMethodParameters(params);
        const httpMethod = this.getHttpMethod(endpoint);
        const pathExpression = this.getPathExpression(endpoint);
        const requestBody = this.getRequestBody(endpoint, params);

        const returnType = rust.Type.result(
            this.getReturnType(endpoint),
            rust.Type.reference(rust.reference({ name: "ClientError" }))
        );

        return {
            name: endpoint.name.snakeCase.safeName,
            parameters,
            returnType: returnType.toString(),
            isAsync: true,
            body: `self.http_client.execute_request(
            Method::${httpMethod},
            ${pathExpression},
            ${requestBody},
            options,
        ).await`
        };
    }

    private buildMethodParameters(params: EndpointParameter[]): string[] {
        return [
            ...params.map((param) => {
                let paramType = param.type.toString();

                if (param.isRef) {
                    paramType = `&${paramType}`;
                }

                if (param.optional) {
                    paramType = `Option<${paramType}>`;
                }

                return `${param.name}: ${paramType}`;
            }),
            "options: Option<RequestOptions>"
        ];
    }

    // =============================================================================
    // PARAMETER EXTRACTION
    // =============================================================================

    private extractParametersFromEndpoint(endpoint: HttpEndpoint): EndpointParameter[] {
        const params: EndpointParameter[] = [];

        this.addPathParameters(endpoint, params);
        this.addQueryParameters(endpoint, params);
        this.addRequestBodyParameter(endpoint, params);

        return params;
    }

    private addPathParameters(endpoint: HttpEndpoint, params: EndpointParameter[]): void {
        endpoint.fullPath.parts.forEach((part) => {
            if (part.pathParameter) {
                const pathParam = endpoint.allPathParameters.find((p) => p.name.originalName === part.pathParameter);
                if (pathParam) {
                    params.push({
                        name: pathParam.name.snakeCase.safeName,
                        type: generateRustTypeForTypeReference(pathParam.valueType),
                        isRef: this.shouldPassByReference(pathParam.valueType),
                        optional: false
                    });
                }
            }
        });
    }

    private addQueryParameters(endpoint: HttpEndpoint, params: EndpointParameter[]): void {
        endpoint.queryParameters.forEach((queryParam) => {
            params.push({
                name: queryParam.name.name.snakeCase.safeName,
                type: generateRustTypeForTypeReference(queryParam.valueType),
                optional: true,
                isRef: this.shouldPassByReference(queryParam.valueType)
            });
        });
    }

    private addRequestBodyParameter(endpoint: HttpEndpoint, params: EndpointParameter[]): void {
        if (endpoint.requestBody) {
            const requestBodyType = endpoint.requestBody._visit({
                inlinedRequestBody: () => {
                    return rust.Type.reference(rust.reference({ name: "Value", module: "serde_json" }));
                },
                reference: (reference) => generateRustTypeForTypeReference(reference.requestBodyType),
                fileUpload: () => {
                    return rust.Type.reference(rust.reference({ name: "Value", module: "serde_json" }));
                },
                bytes: () => rust.Type.vec(rust.Type.primitive(rust.PrimitiveType.U8)),
                _other: () => {
                    return rust.Type.reference(rust.reference({ name: "Value", module: "serde_json" }));
                }
            });

            params.push({
                name: "request",
                type: requestBodyType,
                isRef: true,
                optional: false
            });
        }
    }

    // =============================================================================
    // TYPE AND REFERENCE UTILITIES
    // =============================================================================

    private shouldPassByReference(typeRef: TypeReference): boolean {
        return TypeReference._visit(typeRef, {
            primitive: (primitiveType) => {
                return PrimitiveTypeV1._visit(primitiveType.v1, {
                    string: () => true,
                    boolean: () => false,
                    integer: () => false,
                    uint: () => false,
                    uint64: () => false,
                    long: () => false,
                    float: () => false,
                    double: () => false,
                    bigInteger: () => true, // BigInt is large, pass by reference
                    date: () => true,
                    dateTime: () => true,
                    base64: () => true, // Base64 strings are typically large
                    uuid: () => true,
                    _other: () => true
                });
            },
            named: () => true, // User-defined types usually passed by reference
            container: () => true, // Collections passed by reference
            unknown: () => true,
            _other: () => true
        });
    }

    private getReturnType(endpoint: HttpEndpoint): rust.Type {
        if (endpoint.response?.body) {
            return endpoint.response.body._visit({
                json: (jsonResponse) => {
                    if (jsonResponse.responseBodyType) {
                        return generateRustTypeForTypeReference(jsonResponse.responseBodyType);
                    }
                    return rust.Type.reference(rust.reference({ name: "Value", module: "serde_json" }));
                },
                fileDownload: () => rust.Type.vec(rust.Type.primitive(rust.PrimitiveType.U8)),
                text: () => rust.Type.primitive(rust.PrimitiveType.String),
                bytes: () => rust.Type.vec(rust.Type.primitive(rust.PrimitiveType.U8)),
                streaming: () => {
                    return rust.Type.reference(rust.reference({ name: "Value", module: "serde_json" }));
                },
                streamParameter: () => rust.Type.reference(rust.reference({ name: "Value", module: "serde_json" })),
                _other: () => rust.Type.reference(rust.reference({ name: "Value", module: "serde_json" }))
            });
        }

        return rust.Type.tuple([]);
    }

    // =============================================================================
    // HTTP REQUEST BUILDING
    // =============================================================================

    private getHttpMethod(endpoint: HttpEndpoint): string {
        return endpoint.method.toUpperCase();
    }

    private getPathExpression(endpoint: HttpEndpoint): string {
        const pathParams: string[] = [];
        let path = endpoint.fullPath.head;

        endpoint.fullPath.parts.forEach((part) => {
            if (part.pathParameter) {
                const pathParam = endpoint.allPathParameters.find((p) => p.name.originalName === part.pathParameter);
                if (pathParam) {
                    path += "{}";
                    const paramName = this.getPathParameterExpression(
                        pathParam.valueType,
                        pathParam.name.snakeCase.safeName
                    );
                    pathParams.push(paramName);
                }
            } else {
                path += part.tail;
            }
        });

        if (pathParams.length > 0) {
            return `&format!("${path}", ${pathParams.join(", ")})`;
        }
        return `"${path}"`;
    }

    private getPathParameterExpression(typeRef: TypeReference, paramName: string): string {
        return TypeReference._visit(typeRef, {
            primitive: () => paramName,
            named: (namedType) => {
                const typeDeclaration = this.context.ir.types[namedType.typeId];
                if (typeDeclaration?.shape.type === "alias") {
                    const aliasedType = typeDeclaration.shape.aliasOf;
                    if (
                        TypeReference._visit(aliasedType, {
                            primitive: () => true,
                            named: () => false,
                            container: () => false,
                            unknown: () => false,
                            _other: () => false
                        })
                    ) {
                        return `${paramName}.0`;
                    }
                }
                return paramName;
            },
            container: () => paramName,
            unknown: () => paramName,
            _other: () => paramName
        });
    }

    private getRequestBody(endpoint: HttpEndpoint, params: EndpointParameter[]): string {
        const requestBodyParam = params.find((param) => param.name === "request");
        if (requestBodyParam && endpoint.requestBody) {
            return "Some(serde_json::to_value(request).unwrap_or_default())";
        }
        return "None";
    }

    // =============================================================================
    // UTILITY METHODS
    // =============================================================================

    private hasTypes(context: SdkGeneratorContext): boolean {
        return Object.keys(context.ir.types).length > 0;
    }
}
