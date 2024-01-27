import { Color } from "excalibur";
import { EntityLayer } from "./entity-layer";
import { IntGridLayer } from "./intgrid-layer";
import { LdtkResource } from "./ldtk-resource";
import { TileLayer } from "./tile-layer";
import { LdtkLevel } from "./types";

export class Level {

    public backgroundColor?: Color;
    public layers: (TileLayer | IntGridLayer | EntityLayer)[] = []; 

    constructor(public ldtkLevel: LdtkLevel, public resource: LdtkResource) {
        if (ldtkLevel.__bgColor) {
            this.backgroundColor = Color.fromHex(ldtkLevel.__bgColor);
        }
        if (ldtkLevel.layerInstances) {
            let order = resource.startZIndex;
            let layers = ldtkLevel.layerInstances.slice().reverse();
            for (let layer of layers) {
                if (layer.entityInstances?.length !== 0) {
                    this.layers.push(new EntityLayer(this, layer, resource, order));
                }

                if (layer.gridTiles?.length !== 0) {
                    this.layers.push(new TileLayer(this, layer, resource, order));
                }

                if (layer.intGridCsv?.length !== 0) {
                    this.layers.push(new IntGridLayer(this, layer, resource, order));
                }
                order++;
            }
        }
    }
}