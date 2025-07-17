import { AbstractGeneratorCli, AbstractGeneratorContext, parseIR } from "@fern-api/base-generator";
import { AbsoluteFilePath } from "@fern-api/fs-utils";

import { IntermediateRepresentation } from "@fern-fern/ir-sdk/api";
import * as IrSerialization from "@fern-fern/ir-sdk/serialization";

export abstract class AbstractRustGeneratorCli<
    CustomConfig,
    Context extends AbstractGeneratorContext
> extends AbstractGeneratorCli<CustomConfig, IntermediateRepresentation, Context> {
    /**
     * Parses the IR for the Rust generators
     * @param irFilepath
     * @returns
     */
    protected async parseIntermediateRepresentation(irFilepath: string): Promise<IntermediateRepresentation> {
        return await parseIR<IntermediateRepresentation>({
            absolutePathToIR: AbsoluteFilePath.of(irFilepath),
            parse: IrSerialization.IntermediateRepresentation.parse
        });
    }
} 