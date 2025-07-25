import { CSharpFile, FileGenerator } from "@fern-api/csharp-base";
import { csharp } from "@fern-api/csharp-codegen";
import { RelativeFilePath, join } from "@fern-api/fs-utils";

import { HttpService, ServiceId, Subpackage } from "@fern-fern/ir-sdk/api";

import { SdkCustomConfigSchema } from "../SdkCustomConfig";
import { SdkGeneratorContext } from "../SdkGeneratorContext";
import { RawClient } from "../endpoint/http/RawClient";
import { GrpcClientInfo } from "../grpc/GrpcClientInfo";

export const CLIENT_MEMBER_NAME = "_client";
export const GRPC_CLIENT_MEMBER_NAME = "_grpc";

export declare namespace SubClientGenerator {
    interface Args {
        subpackage: Subpackage;
        context: SdkGeneratorContext;
        serviceId?: ServiceId;
        service?: HttpService;
    }
}

export class SubPackageClientGenerator extends FileGenerator<CSharpFile, SdkCustomConfigSchema, SdkGeneratorContext> {
    private classReference: csharp.ClassReference;
    private subpackage: Subpackage;
    private serviceId?: ServiceId;
    private service?: HttpService;
    private rawClient: RawClient;
    private grpcClientInfo: GrpcClientInfo | undefined;

    constructor({ subpackage, context, serviceId, service }: SubClientGenerator.Args) {
        super(context);
        this.classReference = this.context.getSubpackageClassReference(subpackage);
        this.subpackage = subpackage;
        this.rawClient = new RawClient(context);
        this.service = service;
        this.serviceId = serviceId;
        this.grpcClientInfo =
            this.serviceId != null ? this.context.getGrpcClientInfoForServiceId(this.serviceId) : undefined;
    }

    public doGenerate(): CSharpFile {
        const class_ = csharp.class_({
            ...this.classReference,
            partial: true,
            access: csharp.Access.Public
        });

        class_.addField(
            csharp.field({
                access: csharp.Access.Private,
                name: CLIENT_MEMBER_NAME,
                type: csharp.Type.reference(this.context.getRawClientClassReference())
            })
        );

        if (this.grpcClientInfo != null) {
            class_.addField(
                csharp.field({
                    access: csharp.Access.Private,
                    name: GRPC_CLIENT_MEMBER_NAME,
                    type: csharp.Type.reference(this.context.getRawGrpcClientClassReference())
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

        class_.addConstructor(this.getConstructorMethod());
        if (this.service != null && this.serviceId != null) {
            const methods = this.generateEndpoints();
            class_.addMethods(methods);
        }

        return new CSharpFile({
            clazz: class_,
            directory: RelativeFilePath.of(this.context.getDirectoryForSubpackage(this.subpackage)),
            allNamespaceSegments: this.context.getAllNamespaceSegments(),
            allTypeClassReferences: this.context.getAllTypeClassReferences(),
            namespace: this.context.getNamespace(),
            customConfig: this.context.customConfig
        });
    }

    private generateEndpoints(): csharp.Method[] {
        const service = this.service;
        if (!service) {
            throw new Error("Internal error; Service is not defined");
        }
        const serviceId = this.serviceId;
        if (!serviceId) {
            throw new Error("Internal error; ServiceId is not defined");
        }
        return service.endpoints.flatMap((endpoint) => {
            return this.context.endpointGenerator.generate({
                serviceId,
                endpoint,
                rawClientReference: CLIENT_MEMBER_NAME,
                rawClient: this.rawClient,
                rawGrpcClientReference: GRPC_CLIENT_MEMBER_NAME,
                grpcClientInfo: this.grpcClientInfo
            });
        });
    }

    private getConstructorMethod(): csharp.Class.Constructor {
        const parameters: csharp.Parameter[] = [
            csharp.parameter({
                name: "client",
                type: csharp.Type.reference(this.context.getRawClientClassReference())
            })
        ];
        return {
            access: csharp.Access.Internal,
            parameters,
            body: csharp.codeblock((writer) => {
                writer.writeLine("_client = client;");

                if (this.grpcClientInfo != null) {
                    writer.writeLine("_grpc = _client.Grpc;");
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

    private getSubpackages(): Subpackage[] {
        return this.subpackage.subpackages.map((subpackageId) => {
            return this.context.getSubpackageOrThrow(subpackageId);
        });
    }

    protected getFilepath(): RelativeFilePath {
        return join(
            this.context.project.filepaths.getSourceFileDirectory(),
            RelativeFilePath.of(this.classReference.name + ".cs")
        );
    }
}
