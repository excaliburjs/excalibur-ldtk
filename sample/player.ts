import * as ex from "excalibur";

export class Player extends ex.Actor {
    // TODO document this is a requirement
    constructor(options: ex.ActorArgs) {
        super({
            ...options,
            color: ex.Color.Red,
            collisionType: ex.CollisionType.Active
        });
    }

    override onPostUpdate(engine: ex.Engine, _delta: number): void {
        this.vel = ex.vec(0, 0);
        const speed = 64;
        if (engine.input.keyboard.isHeld(ex.Input.Keys.Right)) {
           this.vel.x = speed;
        }
        if (engine.input.keyboard.isHeld(ex.Input.Keys.Left)) {
           this.vel.x = -speed;
        }
        if (engine.input.keyboard.isHeld(ex.Input.Keys.Up)) {
           this.vel.y = -speed;
        }
        if (engine.input.keyboard.isHeld(ex.Input.Keys.Down)) {
           this.vel.y = speed;
        }
    }
}