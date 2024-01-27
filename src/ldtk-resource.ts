import { TileLayer } from './tile-layer';
import { PathMap, pathRelativeToBase } from './path-util';
import { FetchLoader, FileLoader } from './file-loader';
import { LdtkEntityDefinition, LdtkEntityInstance, LdtkProjectMetadata } from './types';
import { compare } from 'compare-versions';
import { LoaderCache } from './loader-cache';
import { BoundingBox, Entity, ImageSource, Loadable, Scene, TransformComponent, Vector, vec } from 'excalibur';
import { LevelResource } from './level-resource';
import { Tileset } from './tileset';
import { Level } from './level';
import { EntityLayer } from './entity-layer';
import { IntGridLayer } from './intgrid-layer';

export interface AddToSceneOptions {
    /**
     * Optionally set the position to place the levels
     * 
     * Default is vec(0, 0)
     */
    pos?: Vector;
    /**
     * Optionally add only specific levels to the scene
     * 
     * Default includes all levels
     */
    levelFilter?: string[];

    /**
     * Optionally use the level world offsets, this is useful if your levels are arranged the way you want them
     * to appear in your game.
     * 
     * Default is true
     */
    useLevelOffsets?: boolean;
}

export interface FactoryProps {
    /**
     * Excalibur world position
     */
    worldPos: Vector;
    /**
     * LDtk name in UI
     */
    name?: string;
    /**
     * LDtk type in UI
     */
    type: string;
    /**
     * LDtk entity
     */
    entity: LdtkEntityInstance;
    /**
     * LDtk entity metadata
     */
    definition: LdtkEntityDefinition | undefined;
    /**
     * Layer
     */
    layer: EntityLayer;
}

export interface LdtkResourceOptions {
    /**
    * Add a starting z index for the layers to use. By default the layers count up from 0.
    *
    * If you'd like to manually override a z-index on a layer use the 'zindex' custom property on a layer.
    */
    startZIndex?: number;

    /**
     * Default true. If false, only tilemap will be parsed and displayed, it's up to you to wire up any excalibur behavior.
     * Automatically wires excalibur to the following
     * * Wire up current scene camera
     *
     * Read more at excaliburjs.com!
     */
    useExcaliburWiring?: boolean;

    /**
     * Sets excalibur's background color to match the LDtk map
     */
    useMapBackgroundColor?: boolean;

    /**
     * The pathMap helps work around odd things bundlers do with static files by providing a way to redirect the original
     * source paths in the LDtk files to new locations.
     *
     * When the LDtk resource comes across something that matches `path`, it will use the output string instead.
     * 
     * Example:
     * ```typescript
     * const newResource = new LdtkResource('./example-city.ldtk', {
     *     pathMap: [
     *        // If the "path" is included in the source path, the output will be used
     *        { path: 'cone.png', output: '/static/assets/cone.png' },
     *        // Regex matching with special [match] in output string that is replaced with the first match from the regex
     *        { path: /(.*\..*$)/, output: '/static/assets/[match]'}
     *     ]
     *  }
     * ```
     */
    pathMap?: PathMap;

    /**
     * Optionally provide a custom file loader implementation instead of using the built in ajax (fetch) loader
     * that takes a path and returns file data
     * 
     */
    fileLoader?: FileLoader;

    /**
     * By default `true`, means LDtk files must pass the plugins Typed parse pass.
     *
     * If you have something that the LDtk plugin does not expect, you can set this to false and it will do it's best
     * to parse the LDtk source map file.
     */
    strict?: boolean;

    /**
    * Plugin will operate in headless mode and skip all graphics related
    * excalibur items including creating ImageSource's for LDtk items.
    *
    * Default false.
    */
    headless?: boolean;

    /**
     * Keeps the camera viewport within the bounds of the TileMap, uses the first tile layer's bounds.
     *
     * Defaults true, if false the camera will use the layer bounds to keep the camera from showing the background.
     */
    useTilemapCameraStrategy?: boolean;

    /**
     * Configure custom Actor/Entity factory functions to construct Actors/Entities
     * given a LDtk type name
     */
    entityIdentifierFactories?: Record<string, (props: FactoryProps) => Entity | undefined>;
}

export class LdtkResource implements Loadable<LdtkProjectMetadata> {
    public static supportedLdtkVersion = "1.5.3";
    public projectMetadata!: LdtkProjectMetadata;
    data!: LdtkProjectMetadata;


    public tilesets = new Map<number, Tileset>();
    public levels = new Map<number, Level>();
    public levelsByName = new Map<string, Level>();
    public factories = new Map<string, (props: FactoryProps) => Entity | undefined>();
    public fileLoader: FileLoader = FetchLoader;
    public pathMap: PathMap | undefined;

    private _imageLoader = new LoaderCache(ImageSource);
    private _levelLoader = new LoaderCache(LevelResource);


    public readonly startZIndex: number = 0;
    public readonly textQuality: number = 4;
    public readonly useExcaliburWiring: boolean = true;
    public readonly useMapBackgroundColor: boolean = false;
    public readonly useTilemapCameraStrategy: boolean = false;
    public readonly headless: boolean = false;
    public readonly strict: boolean = true;

    constructor(public readonly path: string, options?: LdtkResourceOptions) {
        const {
            useExcaliburWiring,
            useTilemapCameraStrategy,
            entityIdentifierFactories,
            pathMap,
            useMapBackgroundColor,
            fileLoader,
            strict,
            headless,
            startZIndex
        } = { ...options };
        this.strict = strict ?? this.strict;
        this.headless = headless ?? this.headless;
        this.useExcaliburWiring = useExcaliburWiring ?? this.useExcaliburWiring;
        this.useTilemapCameraStrategy = useTilemapCameraStrategy ?? this.useTilemapCameraStrategy;
        this.useMapBackgroundColor = useMapBackgroundColor ?? this.useMapBackgroundColor;
        this.startZIndex = startZIndex ?? this.startZIndex;
        this.fileLoader = fileLoader ?? this.fileLoader;
        this.pathMap = pathMap;
        for (const key in entityIdentifierFactories) {
            this.registerEntityIdentifierFactory(key, entityIdentifierFactories[key]);
        }

    }
    async load(): Promise<LdtkProjectMetadata> {
        const data = await this.fileLoader(this.path, 'json');
        if (this.strict) {
            try {
                this.projectMetadata = LdtkProjectMetadata.parse(data);
            } catch (e) {
                console.error(`Could not parse LDtk map from location ${this.path}.\nExcalibur only supports the latest version of LDtk formats as of the plugin's release.`);
                console.error(`Is your map file corrupted or being interpreted as the wrong type?`)
                throw e;
            }
        } else {
            this.projectMetadata = data as LdtkProjectMetadata;
        }

        if (compare(LdtkResource.supportedLdtkVersion, this.projectMetadata.jsonVersion ?? '0.0.0', ">")) {
            console.warn(`The excalibur ldtk plugin officially supports ${LdtkResource.supportedLdtkVersion}+, the current map has LDtk version ${this.projectMetadata.jsonVersion}`)
        }

        // iterate through the defs
        // load the tilesets
        const imagesToLoad: Promise<HTMLImageElement>[] = [];
        for (let tileset of this.projectMetadata.defs.tilesets) {
            if (tileset.relPath) {
                const imagePath = pathRelativeToBase(this.path, tileset.relPath, this.pathMap);
                const image = this._imageLoader.getOrAdd(imagePath);
                const friendlyTileset = new Tileset({
                    image,
                    ldtkTileset: tileset
                });
                this.tilesets.set(tileset.uid, friendlyTileset);
            } else {
                console.warn(`No tileset image provided for ${tileset.identifier}`);
            }
        }

        // iterate through the levels
        // load the level metadata
        for (let level of this.projectMetadata.levels) {
            if (level.externalRelPath) {
                // external levels
                const levelPath = pathRelativeToBase(this.path, level.externalRelPath, this.pathMap);
                this._levelLoader.getOrAdd(levelPath, this, {
                    headless: this.headless,
                    strict: this.strict,
                    fileLoader: this.fileLoader,
                    imageLoader: this._imageLoader,
                    pathMap: this.pathMap
                });
            } else {
                // embedded levels
                const friendlyLevel = new Level(level, this);
                this.levels.set(level.uid, friendlyLevel);
                this.levelsByName.set(level.identifier, friendlyLevel);
            }
        }

        await Promise.all([this._imageLoader.load(), this._levelLoader.load()]);
        this._levelLoader.values().forEach(level => {
            this.levels.set(level.data.ldtkLevel.uid, level.data);
            this.levelsByName.set(level.data.ldtkLevel.identifier, level.data);
        });

        return this.data = this.projectMetadata;
    };

    isLoaded(): boolean {
        return !!this.data;
    }

    registerEntityIdentifierFactory(ldtkEntityIdentifier: string, factory: (props: FactoryProps) => Entity | undefined): void {
        this.factories.set(ldtkEntityIdentifier, factory);
        if (this.isLoaded()) {
            for (let entityLayer of this.getEntityLayers()) {
                entityLayer.runFactory(ldtkEntityIdentifier);
            }
        }
    }

    /**
     * Get a level by identifier
     * @param identifier 
     * @returns 
     */
    getLevel(identifier: string): Level | undefined {
        return this.levelsByName.get(identifier);
    }

    /**
     * Get the entity layers, optionally provide a level identifier to filter to
     * @param identifier 
     */
    getEntityLayers(identifier?: string): EntityLayer[] {
        let results: EntityLayer[] = [];
        if (identifier) {
            const level = this.getLevel(identifier);
            if (level) {
                for (let layer of level.layers) {
                    if (layer instanceof EntityLayer) {
                        results.push(layer);
                    }
                }
            }
        } else {
            for (const level of this.levels.values()) {
                for (let layer of level.layers) {
                    if (layer instanceof EntityLayer) {
                        results.push(layer);
                    }
                }
            }
        }

        return results
    }

    getTileLayers(identifier?: string): TileLayer[] {
        let results: TileLayer[] = [];
        if (identifier) {
            const level = this.getLevel(identifier);
            if (level) {
                for (let layer of level.layers) {
                    if (layer instanceof TileLayer) {
                        results.push(layer);
                    }
                }
            }
        } else {
            for (const level of this.levels.values()) {
                for (let layer of level.layers) {
                    if (layer instanceof TileLayer) {
                        results.push(layer);
                    }
                }
            }
        }
        return results;
    }

    getIntGridLayers(identifier?: string): IntGridLayer[] {
        let results: IntGridLayer[] = [];
        if (identifier) {
            const level = this.getLevel(identifier);
            if (level) {
                for (let layer of level.layers) {
                    if (layer instanceof IntGridLayer) {
                        results.push(layer);
                    }
                }
            }
        } else {
            for (const level of this.levels.values()) {
                for (let layer of level.layers) {
                    if (layer instanceof IntGridLayer) {
                        results.push(layer);
                    }
                }
            }
        }
        return results;
    }

    /**
     * Search layer for entities that match an identifier (case insensitive)
     * @param identifier 
     * @returns 
     */
    getLdtkEntitiesByIdentifier(identifier: string): LdtkEntityInstance[] {
        let results: LdtkEntityInstance[] = [];
        const layers = this.getEntityLayers();
        for (let layer of layers) {
            results = results.concat(layer.getLdtkEntitiesByIdentifier(identifier));
        }
        return results;
    }

    /**
     * Search layer for entities that match a field and optionally a value (both case insensitive)
     * @param fieldIdentifier 
     * @param value
     */
    getLdtkEntitiesByField(fieldIdentifier: string, value?: any): LdtkEntityInstance[] {
        let results: LdtkEntityInstance[] = [];
        const layers = this.getEntityLayers();
        for (let layer of layers) {
            results = results.concat(layer.getLdtkEntitiesByField(fieldIdentifier, value));
        }
        return results;
    }

    addToScene(scene: Scene, options?: AddToSceneOptions) {
        const { pos, useLevelOffsets } = {pos: vec(0, 0), useLevelOffsets: true, ...options};

        for (let [id, level] of this.levels.entries()) {
            if (options?.levelFilter?.length) {
                if (!options.levelFilter.includes(level.ldtkLevel.identifier)) {
                    continue;
                }
            }
            for (let layer of level.layers) {
                if (layer instanceof TileLayer || layer instanceof IntGridLayer) {
                    layer.tilemap.pos = layer.tilemap.pos.add(pos);
                    if (!useLevelOffsets) {
                        layer.tilemap.pos = layer.tilemap.pos.sub(layer.worldPos);
                    }
                    scene.add(layer.tilemap)
                } else {
                    for (let entity of layer.entities) {
                        const tx = entity.get(TransformComponent);
                        if (tx) {
                            tx.pos = tx.pos.add(pos);
                            if (!useLevelOffsets) {
                                tx.pos = tx.pos.sub(layer.worldPos);
                            }
                        }
                        scene.add(entity);
                    }
                }
            }
        }

        if(this.useExcaliburWiring) {
            const camera = this.getLdtkEntitiesByField('camera', true)[0];
            if (camera) {
                scene.camera.pos = vec(camera.px[0], camera.px[0]);
                const zoom = camera.fieldInstances.find(f => f.__identifier.toLocaleLowerCase() === 'zoom');
                if (zoom) {
                    scene.camera.zoom = +zoom.__value;
                }
            }
        }

        if (this.useTilemapCameraStrategy) {
            let bounds = new BoundingBox();
            for (const level of this.levels.values()) {
                const firstTileLayer = this.getTileLayers(level.ldtkLevel.identifier)[0];
                if (firstTileLayer) {
                    bounds = bounds.combine(
                        BoundingBox.fromDimension(
                            firstTileLayer.tilemap.tileWidth * firstTileLayer.tilemap.columns,
                            firstTileLayer.tilemap.tileHeight * firstTileLayer.tilemap.rows,
                            Vector.Zero,
                            firstTileLayer.tilemap.pos)
                    );
                }
            }
            scene.camera.strategy.limitCameraBounds(bounds);
        }

        if (this.useMapBackgroundColor) {
            for (let [id, level] of this.levels.entries()) {
                if (options?.levelFilter?.length) {
                    if (!options.levelFilter.includes(level.ldtkLevel.identifier)) {
                        continue;
                    }
                }
                scene.backgroundColor = level.backgroundColor;
                break;
            }
        }


    }
}