import { GraphicsComponent, TileMap, Vector, vec } from "excalibur";
import { LdtkLayerInstance } from "./types";
import { LdtkResource } from "./ldtk-resource";
import { Level } from "./level";
import { Tileset } from "./tileset";

export class IntGridLayer {

    public ldtkLayer: LdtkLayerInstance;
    public worldPos: Vector;
    public offset: Vector;
    public tilemap!: TileMap;
    public tileset?: Tileset;

    constructor(level: Level, ldtkLayer: LdtkLayerInstance, resource: LdtkResource, public readonly order: number) {
        this.worldPos = vec(level.ldtkLevel.worldX, level.ldtkLevel.worldY);
        this.offset = vec(ldtkLayer.__pxTotalOffsetX, ldtkLayer.__pxTotalOffsetY);
        this.ldtkLayer = ldtkLayer;
        if (ldtkLayer.intGridCsv.length || ldtkLayer.autoLayerTiles.length) {

            const rows = ldtkLayer.__cHei;
            const columns = ldtkLayer.__cWid;
            this.tilemap = new TileMap({
                name: ldtkLayer.__identifier,
                pos: this.worldPos.add(this.offset),
                tileWidth: ldtkLayer.__gridSize,
                tileHeight: ldtkLayer.__gridSize,
                rows,
                columns,
            });
            this.tilemap.z = order;
            const graphics = this.tilemap.get(GraphicsComponent);
            graphics.isVisible = ldtkLayer.visible;

            // find the intgrid metadata
            const layerMetadata = resource.projectMetadata.defs.layers.find(l => {
                return ldtkLayer.__identifier === l.identifier;
            });

            if (layerMetadata) {
                const solidValues = layerMetadata.intGridValues.filter(val => {
                    return val?.identifier?.toLocaleLowerCase().startsWith('solid');
                }).map(val => val.value);

                for (let i = 0; i < ldtkLayer.intGridCsv.length; i++) {
                    const xCoord = i % columns;
                    const yCoord = Math.floor(i / columns);
                    const tile = this.tilemap.getTile(xCoord, yCoord);
                    if (solidValues.includes(ldtkLayer.intGridCsv[i])) {
                        tile!.solid = true;
                    }
                }

                if (ldtkLayer.__tilesetDefUid) {
                    this.tileset = resource.tilesets.get(ldtkLayer.__tilesetDefUid);
                    for (let i = 0; i < ldtkLayer.autoLayerTiles.length; i++) {
                        const tile = ldtkLayer.autoLayerTiles[i];
                        const xCoord = Math.floor(tile.px[0] / ldtkLayer.__gridSize);
                        const yCoord = Math.floor(tile.px[1] / ldtkLayer.__gridSize);
                        const exTile = this.tilemap.getTile(xCoord, yCoord);
                        if (exTile && this.tileset) {
                            const tsxCoord = Math.floor((tile.src[0] - (this.tileset.ldtkTileset.padding ?? 0)) / (this.tileset.ldtkTileset.tileGridSize + (this.tileset.ldtkTileset.spacing ?? 0)));
                            const tsyCoord = Math.floor((tile.src[1] - (this.tileset.ldtkTileset.padding ?? 0)) / (this.tileset.ldtkTileset.tileGridSize + (this.tileset.ldtkTileset.spacing ?? 0)));
                            // Bit 0 toggles x flip
                            // Bit 1 toggles 1 flip
                            // Examples: f=0 (no flip), f=1 (X flip only), f=2 (Y flip only), f=3 (both flips)
                            const flipHorizontal = !!(tile.f & 0b01);
                            const flipVertical = !!(tile.f & 0b10);
                            let sprite = this.tileset.spritesheet.getSprite(tsxCoord, tsyCoord);
                            if (flipHorizontal || flipVertical) {
                                sprite = sprite.clone();
                                sprite.flipHorizontal = flipHorizontal;
                                sprite.flipVertical = flipVertical;
                            }
                            if (sprite) {
                                exTile!.addGraphic(sprite);
                            } else {
                                console.error('Could not find sprite in LDtk spritesheet at', tsxCoord, tsyCoord);
                            }
                        }
                    }
                }
            }
        }
    }
}