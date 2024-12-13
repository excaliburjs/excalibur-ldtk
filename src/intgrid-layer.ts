import { TileMap, Vector, vec } from "excalibur";
import { LdtkLayerInstance } from "./types";
import { LdtkResource } from "./ldtk-resource";
import { Level } from "./level";

export class IntGridLayer {

    public ldtkLayer: LdtkLayerInstance;
    public worldPos: Vector;
    public offset: Vector;
    public tilemap!: TileMap;
    constructor(level: Level, ldtkLayer: LdtkLayerInstance, resource: LdtkResource, public readonly order: number) {
        this.worldPos = vec(level.ldtkLevel.worldX, level.ldtkLevel.worldY);
        this.offset = vec(ldtkLayer.__pxTotalOffsetX, ldtkLayer.__pxTotalOffsetY);
        this.ldtkLayer = ldtkLayer;
        if (ldtkLayer.intGridCsv.length) {

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

            // find the intgrid metadata
            const layerMetadata = resource.projectMetadata.defs.layers.find(l => {
                return ldtkLayer.__identifier === l.identifier;
            });

            if (layerMetadata) {
                const solidValue = layerMetadata.intGridValues.find(val => {
                    return val?.identifier?.toLocaleLowerCase() === 'solid';
                });

                for (let i = 0; i < ldtkLayer.intGridCsv.length; i++) {
                    const xCoord = i % columns;
                    const yCoord = Math.floor(i / columns);
                    const tile = this.tilemap.getTile(xCoord, yCoord);
                    if (solidValue && ldtkLayer.intGridCsv[i] === solidValue.value) {
                        tile!.solid = true;
                    }

                    // TODO might be a mistake to treat 1 as solid if there isn't a labelled solid
                    if (!solidValue && ldtkLayer.intGridCsv[i] === 1) {
                        tile!.solid = true;
                    }
                }
            }
        }
    }
}