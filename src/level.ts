import { EntityLayer } from "./entity-layer";
import { IntGridLayer } from "./intgrid-layer";
import { LdtkResource } from "./ldtk-resource";
import { TileLayer } from "./tile-layer";
import { LdtkLevel } from "./types";

export class Level {

    public layers: (TileLayer | IntGridLayer | EntityLayer)[] = []; 

    constructor(public ldtkLevel: LdtkLevel, public resource: LdtkResource) {
        if (ldtkLevel.layerInstances) {
            let order = resource.startZIndex;
            for (let layer of ldtkLevel.layerInstances) {
                // Parse entity layer
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
                    this.layers.push(new TileLayer(layer, resource, order));
                }

                if (layer.intGridCsv?.length !== 0) {
                    this.layers.push(new IntGridLayer(layer, resource, order));
                }
                order++;
            }
        }
    }

    parseTileLayer(): TileLayer {

    }

    parseEntityLayer(): EntityLayer {

    }

    parseIntGridLayer(): IntGridLayer {
        
    }
}