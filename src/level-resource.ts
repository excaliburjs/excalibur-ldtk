import { ImageSource, Loadable } from "excalibur";
import { PathMap } from "./path-util";
import { LoaderCache } from "./loader-cache";
import { FetchLoader, FileLoader } from "./file-loader";
import { Level } from "./level";
import { LdtkLevel } from "./types";
import { LdtkResource } from "./ldtk-resource";

export interface LevelResourceOptions {
    headless?: boolean;
    strict?: boolean;
    fileLoader?: FileLoader;
    imageLoader?: LoaderCache<ImageSource>;
    pathMap?: PathMap;
}

/**
 * Loads LDtk levels that are stored in separate files
 */
export class LevelResource implements Loadable<Level> {
    private fileLoader: FileLoader = FetchLoader;
    private imageLoader: LoaderCache<ImageSource>;
    private pathMap?: PathMap;
    public readonly strict: boolean = true;
    public readonly headless: boolean = false;
    constructor(public readonly path: string, public readonly resource: LdtkResource, options?: LevelResourceOptions) {
        const { headless, strict, fileLoader, imageLoader, pathMap } = { ...options };
        this.fileLoader = fileLoader ?? this.fileLoader;
        this.strict = strict ?? this.strict;
        this.headless = headless ?? this.headless;
        this.imageLoader = imageLoader ?? new LoaderCache(ImageSource);
        this.pathMap = pathMap ?? this.pathMap;
    }
    data!: Level;
    async load(): Promise<Level> {
        const data = await this.fileLoader(this.path, 'json');
        let level: LdtkLevel;
        if (this.strict) {
            try {
                level = LdtkLevel.parse(data)
            } catch (e) {
                console.error(`Could not parse LDtk level data at ${this.path} are you sure a level is there and not corrupt?`);
                throw e;
            }
        } else {
            level = data as LdtkLevel;
        }
        return this.data = new Level(level, this.resource);
    }
    isLoaded(): boolean {
        return !!this.data;
    }

}