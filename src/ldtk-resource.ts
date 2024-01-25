import { TileLayer } from './tile-layer';
import { PathMap, pathRelativeToBase } from './path-util';
import { FetchLoader, FileLoader } from './file-loader';
import { LdtkProjectMetadata } from './types';
import { compare } from 'compare-versions';
import { LoaderCache } from './loader-cache';
import { Entity, ImageSource, Loadable, Scene, Vector } from 'excalibur';
import { LevelResource } from './level-resource';
import { Tileset } from './tileset';
import { Level } from './level';

export interface TiledAddToSceneOptions {
    pos: Vector;
}

export interface LdtkTilesetMetadata {
    __cWid: number;
    __cHei: number;
    identifier: string;
    uid: number;
    relPath: string;
    pxWid: number,
    pxHei: number,
    tileGridSize: number,
    spacing: number,
    padding: number,
    tags: string[],
}

export interface IntGridValue {
    value: number;
    identifier: string;
    color: string; //"#000000"
    tile: LdtkTileRect;
    groupUid: number;
}
export interface LdtkLayerMetadata {
    __type: "Tiles" | "Entities" | "IntGrid" | "AutoLayer";
    identifier: string;
    uid: number;
    intGridValues: IntGridValue[];
}

export interface LdtkTileRect {
    tilesetUid: number;
    x: number;
    y: number;
    w: number;
    h: number;
}

export interface LdtkEntityMetadata {
    identifier: string;
    uid: number;
    tags: string[];
    width: number;
    height: number;
    tilesetId: number;
    tileRenderMode: "FitInside";
    tileRect: LdtkTileRect;
    pivotX: number;
    pivotY: number;
}

// export interface LdtkProjectMetadata {
//     worldGridWidth: number,
// 	worldGridHeight: number,
// 	defaultLevelWidth: number,
// 	defaultLevelHeight: number,
//     defaultGridSize: number;
// 	defaultEntityWidth: number;
// 	defaultEntityHeight: number;
//     defs: {
//         layers: LdtkLayerMetadata[];
//         entities: LdtkEntityMetadata[];
//         tilesets: LdtkTilesetMetadata[];
//     };
//     levels: LdtkLevelMetadata[];

// }

export interface LdtkLevelMetadata {
    identifier: string;
    iid: string, // guid
    uid: number,
    worldX: number,
    worldY: number,
    worldDepth: number,
    pxWid: number,
    pxHei: number,
    __bgColor: string, // hex color
    externalRelPath: string, // "top-down/Level_0.ldtkl"
}

export interface LdtkLevel {
    identifier: string;
    iid: string; // guid
    uid: number,
    pxWid: number
    pxHei: number
    layerInstances: LdtkTileLayer[]
}

export interface LdtkTile {
    // TODO account for the layer offsets
    /**
     * Pixel coordinates fo the tile in the layer
     */
    px: [number, number];
    /**
     * pixel coords of the tile in the tileset
     */
    src: [number, number],
    /**
     * Flip bit 0 = no flip, 1 = x flip, 2 = y flip, 3 = both flip
     */
    f: 0,
    /**
     * Tile Id in the tileset
     */
    t: 7,
    /**
     * Opacity
     */
    a: 1
}

export interface LdtkEntity {
    __identifier: string;
    __grid: [number, number];
    __pivot: [number, number];
    __tags: string[];
    __tile: LdtkTileRect;
    __worldX: number;
    __worldY: number;
    iid: string;// guid
    width: number;
    height: number;
    defUid: number; // references the metadata
    px: [number, number];
}

export interface LdtkTileLayer {
    __identifier: string;
    __type: string;
    __cWid: number;
    __cHei: number;
    __gridSize: number;
    __tilesetDefUid: number;
    __tilesetRelPath: string; // "Solaria Demo Pack Update 03/Solaria Demo Pack Update 03/16x16/Tilesets/Solaria Demo Update 01.png",
    iid: string; // "6e47de30-6280-11ee-bc44-b5fa9e2b5fb3",
    levelId: number;
    layerDefUid: number;
    gridTiles: LdtkTile[];
    entityInstances: LdtkEntity[];
    intGridCsv: number[];
}

export interface LdtkTileset {
    metadata: LdtkTilesetMetadata;
    spriteSheet: SpriteSheet;
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
    entity: LdtkEntity;
    /**
     * LDtk entity metadata
     */
    metadata: LdtkEntityMetadata | undefined;
    /**
     * Layer
     */
    layer: TileLayer;
    /**
     * LDtk properties, these are all converted to lowercase keys, and lowercase if the value is a string
     */
    properties: Record<string, any>;
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
     * * Make Actors/Tiles with colliders on Tiled tiles & Tiled objects
     * * Support solid layers
     *
     * Read more at excaliburjs.com!
     */
    useExcaliburWiring?: boolean;

    /**
     * Sets excalibur's background color to match the Tiled map
     */
    useMapBackgroundColor?: boolean;

    /**
     * The pathMap helps work around odd things bundlers do with static files by providing a way to redirect the original
     * source paths in the Tiled files to new locations.
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
     * By default `true`, means Tiled files must pass the plugins Typed parse pass.
     *
     * If you have something that the Tiled plugin does not expect, you can set this to false and it will do it's best
     * to parse the Tiled source map file.
     */
    strict?: boolean;

    /**
    * Plugin will operate in headless mode and skip all graphics related
    * excalibur items including creating ImageSource's for Tiled items.
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
            console.warn(`The excalibur tiled plugin officially supports ${LdtkResource.supportedLdtkVersion}+, the current map has LDtk version ${this.projectMetadata.jsonVersion}`)
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
                // TODO handle embedded atlas
            }
        }

        // iterate through the levels
        // load the level metadata
        const levelsToLoad: Promise<LdtkLevel>[] = [];
        for (let level of this.projectMetadata.levels) {
            if (level.externalRelPath) {
                const levelPath = pathRelativeToBase(this.path, level.externalRelPath, this.pathMap);
                this._levelLoader.getOrAdd(levelPath, {
                    headless: this.headless,
                    strict: this.strict,
                    fileLoader: this.fileLoader,
                    imageLoader: this._imageLoader,
                    pathMap: this.pathMap
                });
            } else {
                // TODO handle null rel path
                // Save levels separately not enabled
                // Are these just embedded?
            }
        }

        await Promise.all([this._imageLoader.load(), this._levelLoader.load()]);
        this._levelLoader.values().forEach(level => {
            this.levels.set(level.data.ldtkLevel.uid, level.data);
        });

        // TODO build up layers

        return this.data = this.projectMetadata;
    };

    
    isLoaded(): boolean {
        return !!this.data;
    }

    registerEntityIdentifierFactory(ldtkEntityIdentifier: string, factory: (props: FactoryProps) => Entity | undefined): void {
        this.factories.set(ldtkEntityIdentifier, factory);
    }

    addToScene(scene: Scene) {

        // Parse all the data and produce excalibur objects
        const tileMaps: TileMap[] = [];
        for (let [id, level] of this.levels.entries()) {
            const totalLayers = level.layerInstances.length;
            let currentLayer = 0;
            for (let layer of level.layerInstances) {
                currentLayer++;
                if (layer.entityInstances?.length !== 0) {
                    for (let entity of layer.entityInstances) {
                        // TODO come up with tags that make sense to communicate to excalibur
                        // TODO metadata pivotX/Y
                        // TODO tileRenderMode
                        const entityMetadata = this.data.defs.entities.find(e => {
                            return e.identifier === entity.__identifier
                        });
                        let actor: Actor;

                        if (this.factories.has(entity.__identifier)) {
                            const factory = this.factories.get(entity.__identifier);
                            if (factory) {
                                const newEntity = factory({
                                    type: entity.__identifier,
                                    worldPos: vec(entity.px[0], entity.px[1]),
                                    entity,
                                    metadata: entityMetadata, //anchor: vec(entityMetadata?.pivotX ?? 0, entityMetadata?.pivotY ?? 0),
                                    layer,
                                    properties: new Map<string, any>()// TODO LDtk props
                                });
                                if (newEntity) {
                                    scene.add(newEntity);
                                }
                            }
                        } else {
                            actor = new Actor({
                                name: entity.__identifier,
                                pos: vec(entity.px[0], entity.px[1]),
                                width: entity.width,
                                height: entity.height,
                                anchor: vec(entityMetadata?.pivotX ?? 0, entityMetadata?.pivotY ?? 0),
                                z: totalLayers - currentLayer
                            });
                            const ts = this.tilesets.get(entity.__tile.tilesetUid);
                            if (ts) {
                                const tsxCoord = Math.floor(entity.__tile.x / entity.__tile.w);
                                const tsyCoord = Math.floor(entity.__tile.y / entity.__tile.h);
                                const sprite = ts.spriteSheet.getSprite(tsxCoord, tsyCoord);
                                if (sprite) {
                                    actor.graphics.use(sprite);
                                }
                            }
                            scene.add(actor);

                        }

                    }
                    continue;
                }

                if (layer.gridTiles?.length !== 0) {
                    // TODO fix the grid size
                    const tilemap = new TileMap({
                        name: layer.__identifier,
                        tileWidth: this.data.defaultGridSize,
                        tileHeight: this.data.defaultGridSize,
                        rows: this.data.worldGridHeight / this.data.defaultGridSize,
                        columns: this.data.worldGridWidth / this.data.defaultGridSize,
                    });
                    tilemap.z = totalLayers - currentLayer;

                    for (let tile of layer.gridTiles) {
                        const xCoord = Math.floor(tile.px[0] / this.data.defaultGridSize);
                        const yCoord = Math.floor(tile.px[1] / this.data.defaultGridSize);
                        const exTile = tilemap.getTile(xCoord, yCoord);
                        const ts = this.tilesets.get(layer.__tilesetDefUid);
                        const tsxCoord = Math.floor(tile.src[0] / this.data.defaultGridSize);
                        const tsyCoord = Math.floor(tile.src[1] / this.data.defaultGridSize);
                        if (ts) {
                            const sprite = ts.spriteSheet.getSprite(tsxCoord, tsyCoord);
                            if (sprite) {
                                exTile.addGraphic(sprite);
                            } else {
                                console.log('Could not find sprite in LDtk spritesheet at', tsxCoord, tsyCoord);
                            }
                        } else {
                            console.log('Could not tileset in LDtk', layer.__tilesetDefUid, layer.__tilesetRelPath);
                        }
                    }
                    tileMaps.push(tilemap);
                }

                if (layer.intGridCsv?.length !== 0) {
                    const rows = layer.__cHei;
                    const columns = layer.__cWid;
                    const tilemap = new TileMap({
                        name: layer.__identifier,
                        tileWidth: layer.__gridSize,
                        tileHeight: layer.__gridSize,
                        rows,
                        columns,
                    });
                    // TODO define what integers mean solid

                    // find the intgrid metadata

                    const layerMetadata = this.data.defs.layers.find(l => {
                        return layer.__identifier === l.identifier;
                    });

                    if (layerMetadata) {
                        const solidValue = layerMetadata.intGridValues.find(val => {
                            return val?.identifier?.toLocaleLowerCase() === 'solid';
                        });

                        for (let i = 0; i < layer.intGridCsv.length; i++) {
                            const xCoord = i % columns;
                            const yCoord = Math.floor(i / columns);
                            const tile = tilemap.getTile(xCoord, yCoord);
                            if (solidValue && layer.intGridCsv[i] === solidValue.value) {
                                tile.solid = true;
                            }

                            // TODO might be a mistake to treat 1 as solid if there isn't a labelled solid
                            if (!solidValue && layer.intGridCsv[i] === 1) {
                                tile.solid = true;
                            }
                        }

                        tileMaps.push(tilemap);
                    }
                }


            }
        }

        tileMaps.forEach(tm => {
            scene.add(tm);
        });
    }
}