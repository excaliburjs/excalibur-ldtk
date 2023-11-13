import * as ex from 'excalibur';

// TODO json representation of Resource<T>

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

export interface LdtkProjectMetadata {
    worldGridWidth: number,
	worldGridHeight: number,
	defaultLevelWidth: number,
	defaultLevelHeight: number,
    defaultGridSize: number;
	defaultEntityWidth: number;
	defaultEntityHeight: number;
    defs: {
        layers: LdtkLayerMetadata[];
        entities: LdtkEntityMetadata[];
        tilesets: LdtkTilesetMetadata[];
    };
    levels: LdtkLevelMetadata[];

}

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
    spriteSheet: ex.SpriteSheet;
}

type ExtendsActorConstructor<TEntity extends ex.Actor> = new (actorArgs: ex.ActorArgs) => TEntity;

export class LdtkResource implements ex.Loadable<LdtkProjectMetadata> {
    private _projectResource: ex.Resource<LdtkProjectMetadata>
    public tilesets = new Map<number, LdtkTileset>();
    public levels = new Map<number, LdtkLevel>();
    public entityToConstructor = new Map<string, ExtendsActorConstructor<any>>();

    public convertPath = (originPath: string, relativePath: string) => {
        // Use absolute path if specified
        if (relativePath.indexOf('/') === 0) {
            return relativePath;
        }

        const originSplit = originPath.split('/');
        const relativeSplit = relativePath.split('/');
        // if origin path is a file, remove it so it's a directory
        if (originSplit[originSplit.length - 1].includes('.')) {
            originSplit.pop();
        }
        return originSplit.concat(relativeSplit).join('/');
    }

    constructor(public path: string) {
        this._projectResource = new ex.Resource(path, 'json');

    }
    async load(): Promise<LdtkProjectMetadata> {
        // TODO maybe use a runtime validation like Zod or something to verify the format is correct


        // after loading the initial meta
        const metadata = await this._projectResource.load();
        // iterate through the defs
        // load the tilesets
        const imagesToLoad: Promise<HTMLImageElement>[] = [];
        for (let tileset of metadata.defs.tilesets) {
            const image = new ex.ImageSource(this.convertPath(this._projectResource.path, tileset.relPath));
            const ss = ex.SpriteSheet.fromImageSource({
                image,
                grid: {
                    rows: tileset.pxHei / tileset.tileGridSize,
                    columns: tileset.pxWid / tileset.tileGridSize,
                    spriteHeight: tileset.tileGridSize,
                    spriteWidth: tileset.tileGridSize
                }
            });
            this.tilesets.set(tileset.uid, {
                metadata: tileset,
                spriteSheet: ss
            })
            imagesToLoad.push(image.load());
        }

        // iterate through the levels
        //  load the level metadata
        const levelsToLoad: Promise<LdtkLevel>[] = [];
        for (let level of metadata.levels) {
            const levelJson = new ex.Resource<LdtkLevel>(this.convertPath(this._projectResource.path, level.externalRelPath), 'json');
            const loadingPromise = levelJson.load();
            levelsToLoad.push(loadingPromise);
            loadingPromise.then(json => {
                this.levels.set(level.uid, json);
            });
        }

        await Promise.all([...imagesToLoad, ...levelsToLoad]);
        return this.data = metadata;
    };

    data!: LdtkProjectMetadata;
    isLoaded(): boolean {
        return !!this.data;
    }

    registerEntityType<TEntity extends ex.Actor>(ldtkEntityIdentifier: string, type: ExtendsActorConstructor<TEntity>) {
        this.entityToConstructor.set(ldtkEntityIdentifier, type);
    }

    parse(scene: ex.Scene) {
        // TODO rename function

        // Parse all the data and produce excalibur objects
        const tileMaps: ex.TileMap[] = [];
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
                        let actor: ex.Actor;

                        if (this.entityToConstructor.has(entity.__identifier)) {
                            const type = this.entityToConstructor.get(entity.__identifier);
                            if (type) {
                                actor = new type({
                                    name: entity.__identifier,
                                    pos: ex.vec(entity.px[0], entity.px[1]),
                                    width: entity.width,
                                    height: entity.height,
                                    anchor: ex.vec(entityMetadata?.pivotX ?? 0, entityMetadata?.pivotY ?? 0),
                                    z: totalLayers - currentLayer
                                });
                                scene.add(actor);
                            }
                        } else {
                            actor = new ex.Actor({
                                name: entity.__identifier,
                                pos: ex.vec(entity.px[0], entity.px[1]),
                                width: entity.width,
                                height: entity.height,
                                anchor: ex.vec(entityMetadata?.pivotX ?? 0, entityMetadata?.pivotY ?? 0),
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
                    const tilemap = new ex.TileMap({
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
                    const tilemap = new ex.TileMap({
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