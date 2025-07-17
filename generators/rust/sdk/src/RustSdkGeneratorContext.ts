import { AbstractGeneratorContext, FernGeneratorExec, GeneratorNotificationService } from "@fern-api/base-generator";
import { RelativeFilePath } from "@fern-api/fs-utils";
import { IntermediateRepresentation } from "@fern-fern/ir-sdk/api";

import { RustSdkCustomConfig } from "./RustSdkCustomConfig";

export class RustSdkGeneratorContext extends AbstractGeneratorContext {
    public readonly project: RustProject;

    public constructor(
        public readonly ir: IntermediateRepresentation,
        public readonly config: FernGeneratorExec.config.GeneratorConfig,
        public readonly customConfig: RustSdkCustomConfig,
        public readonly generatorNotificationService: GeneratorNotificationService
    ) {
        super(config, generatorNotificationService);
        this.project = new RustProject();
    }
}

class RustProject {
    private files: Map<string, string> = new Map();

    async addFile({ path, contents }: { path: RelativeFilePath; contents: string }): Promise<void> {
        this.files.set(path, contents);
    }

    async persist(): Promise<void> {
        // In a real implementation, this would write files to disk
        // For now, we'll just log the generated files
        console.log("Generated Rust SDK files:");
        this.files.forEach((contents, path) => {
            console.log(`  - ${path} (${contents.length} chars)`);
        });
    }
} 