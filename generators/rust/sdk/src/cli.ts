import { RustSdkGeneratorCli } from "./RustSdkGeneratorCli";

void runCli();

export async function runCli(): Promise<void> {
    const cli = new RustSdkGeneratorCli();
    await cli.run();
} 