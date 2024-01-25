import { TileMap } from "excalibur";
import { LdtkLayerInstance } from "./types";
import { LdtkResource } from "./ldtk-resource";

export class IntGridLayer {

    public ldtkLayer: LdtkLayerInstance;
    public tilemap!: TileMap;
    constructor(ldtkLayer: LdtkLayerInstance, resource: LdtkResource, public readonly order: number) {
        this.ldtkLayer = ldtkLayer;
        if (ldtkLayer.intGridCsv.length) {

            const rows = ldtkLayer.__cHei;
            const columns = ldtkLayer.__cWid;
            this.tilemap = new TileMap({
                name: ldtkLayer.__identifier,
                tileWidth: ldtkLayer.__gridSize,
                tileHeight: ldtkLayer.__gridSize,
                rows,
                columns,
            });
            // TODO define what integers mean solid

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
                        tile.solid = true;
                    }

                    // TODO might be a mistake to treat 1 as solid if there isn't a labelled solid
                    if (!solidValue && ldtkLayer.intGridCsv[i] === 1) {
                        tile.solid = true;
                    }
                }
            }
        }
    }
}