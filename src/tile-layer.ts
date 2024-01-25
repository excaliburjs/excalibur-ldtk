import { TileMap } from "excalibur";
import { LdtkResource } from "./ldtk-resource";
import { LdtkLayerInstance } from "./types";


export class TileLayer {
    ldtkLayer: LdtkLayerInstance;
    tilemap: TileMap;
    constructor(ldtkLayer: LdtkLayerInstance, resource: LdtkResource, public readonly order: number) {
        this.ldtkLayer = ldtkLayer;
        this.tilemap = new TileMap({
            name: ldtkLayer.__identifier,
            tileWidth: ldtkLayer.__gridSize,
            tileHeight: ldtkLayer.__gridSize,
            rows: ldtkLayer.__cHei / ldtkLayer.__gridSize,
            columns: ldtkLayer.__cWid / ldtkLayer.__gridSize,
        });
        this.tilemap.z = order;

        for (let tile of ldtkLayer.gridTiles) {
            const xCoord = Math.floor(tile.px[0] / ldtkLayer.__gridSize);
            const yCoord = Math.floor(tile.px[1] / ldtkLayer.__gridSize);
            const exTile = this.tilemap.getTile(xCoord, yCoord);
            if (ldtkLayer.__tilesetDefUid) {
                const ts = resource.tilesets.get(ldtkLayer.__tilesetDefUid);
                if (ts) {
                    const tsxCoord = Math.floor(tile.src[0] / ts.ldtkTileset.tileGridSize);
                    const tsyCoord = Math.floor(tile.src[1] / ts.ldtkTileset.tileGridSize);
                    const sprite = ts.spritesheet.getSprite(tsxCoord, tsyCoord);
                    if (sprite) {
                        exTile.addGraphic(sprite);
                    } else {
                        console.error('Could not find sprite in LDtk spritesheet at', tsxCoord, tsyCoord);
                    }
                }
            } else {
                console.error('Could not tileset in LDtk', ldtkLayer.__tilesetDefUid, ldtkLayer.__tilesetRelPath);
            }
        }
    }
}