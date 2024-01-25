
export class EntityLayer {
    constructor() {
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
}