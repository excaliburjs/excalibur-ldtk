import { TileMap, Vector, vec } from "excalibur";
import { LdtkResource } from "./ldtk-resource";
import { LdtkLayerInstance } from "./types";
import { Level } from "./level";
import { Tileset } from "./tileset";


export class TileLayer {
    public ldtkLayer: LdtkLayerInstance;
    public worldPos: Vector;
    public offset: Vector;
    public tilemap: TileMap;
    public tileset?: Tileset;

    constructor(level: Level, ldtkLayer: LdtkLayerInstance, resource: LdtkResource, public readonly order: number) {
        this.worldPos = vec(level.ldtkLevel.worldX, level.ldtkLevel.worldY);
        this.offset = vec(ldtkLayer.__pxTotalOffsetX, ldtkLayer.__pxTotalOffsetY);
        this.ldtkLayer = ldtkLayer;
        this.tilemap = new TileMap({
            name: ldtkLayer.__identifier,
            pos: this.worldPos.add(this.offset),
            tileWidth: ldtkLayer.__gridSize,
            tileHeight: ldtkLayer.__gridSize,
            rows: ldtkLayer.__cHei,
            columns: ldtkLayer.__cWid,
        });
        this.tilemap.z = order;

        if (ldtkLayer.__tilesetDefUid) {
            this.tileset = resource.tilesets.get(ldtkLayer.__tilesetDefUid);
            for (let tile of ldtkLayer.gridTiles) {
                const xCoord = Math.floor(tile.px[0] / ldtkLayer.__gridSize);
                const yCoord = Math.floor(tile.px[1] / ldtkLayer.__gridSize);
                const exTile = this.tilemap.getTile(xCoord, yCoord);
                if (this.tileset) {
                    const tsxCoord = Math.floor((tile.src[0] - (this.tileset.ldtkTileset.padding ?? 0)) / (this.tileset.ldtkTileset.tileGridSize + (this.tileset.ldtkTileset.spacing ?? 0)));
                    const tsyCoord = Math.floor((tile.src[1] - (this.tileset.ldtkTileset.padding ?? 0)) / (this.tileset.ldtkTileset.tileGridSize + (this.tileset.ldtkTileset.spacing ?? 0)));
                    const sprite = this.tileset.spritesheet.getSprite(tsxCoord, tsyCoord);
                    if (sprite) {
                        exTile.addGraphic(sprite);
                    } else {
                        console.error('Could not find sprite in LDtk spritesheet at', tsxCoord, tsyCoord);
                    }                
                }
            }            
        } else {
            console.error('Could not tileset in LDtk', ldtkLayer.__tilesetDefUid, ldtkLayer.__tilesetRelPath);
        }

    }
}