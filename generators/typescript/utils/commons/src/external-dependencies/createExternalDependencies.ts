import { DependencyManager } from "../dependency-manager/DependencyManager";
import { ImportsManager } from "../imports-manager";
import { ExternalDependencies } from "./ExternalDependencies";
import { BlobImpl } from "./blob/BlobImpl";
import { ExpressImpl } from "./express/ExpressImpl";
import { FsImpl } from "./fs/FsImpl";
import { StreamImpl } from "./stream/StreamImpl";

export declare namespace createExternalDependencies {
    export interface Args {
        importsManager: ImportsManager;
        dependencyManager: DependencyManager;
    }
}

export function createExternalDependencies({
    importsManager,
    dependencyManager
}: createExternalDependencies.Args): ExternalDependencies {
    return {
        express: new ExpressImpl({ importsManager, dependencyManager }),
        fs: new FsImpl({ importsManager, dependencyManager }),
        stream: new StreamImpl({ importsManager, dependencyManager }),
        blob: new BlobImpl({ importsManager, dependencyManager })
    };
}
