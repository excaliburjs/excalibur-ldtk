import { Actor, Entity, vec } from "excalibur";
import { LdtkResource } from "./ldtk-resource";
import { LdtkLayerInstance } from "./types";

export class EntityLayer {
    public entities: Entity[] = [];
    constructor(ldtkLayer: LdtkLayerInstance, resource: LdtkResource, public readonly order: number) {
        if (ldtkLayer.entityInstances) {
            for (let entity of ldtkLayer.entityInstances) {
                // TODO come up with tags that make sense to communicate to excalibur
                // TODO metadata pivotX/Y
                // TODO tileRenderMode
                const entityMetadata = resource.projectMetadata.defs.entities.find(e => {
                    return e.identifier === entity.__identifier
                });
                if (resource.factories.has(entity.__identifier)) {
                    const factory = resource.factories.get(entity.__identifier);
                    if (factory) {
                        const newEntity = factory({
                            type: entity.__identifier,
                            worldPos: vec(entity.px[0], entity.px[1]),
                            entity,
                            definition: entityMetadata,
                            layer: this,
                            properties: new Map<string, any>()// TODO LDtk props
                        });
                        if (newEntity) {
                            this.entities.push(newEntity);
                        }
                    }
                } else {
                    const actor = new Actor({
                        name: entity.__identifier,
                        pos: vec(entity.px[0], entity.px[1]),
                        width: entity.width,
                        height: entity.height,
                        anchor: vec(entityMetadata?.pivotX ?? 0, entityMetadata?.pivotY ?? 0),
                        z: order
                    });
                    const ts = resource.tilesets.get(entity.__tile.tilesetUid);
                    if (ts) {
                        const tsxCoord = Math.floor(entity.__tile.x / entity.__tile.w);
                        const tsyCoord = Math.floor(entity.__tile.y / entity.__tile.h);
                        const sprite = ts.spritesheet.getSprite(tsxCoord, tsyCoord);
                        if (sprite) {
                            actor.graphics.use(sprite);
                        }
                    }
                    this.entities.push(actor);
                }
            }
        }
    }
}