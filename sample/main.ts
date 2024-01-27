
import * as ex from "excalibur";
import { Player } from './player';
import { Resources, loader } from "./resources";

const game = new ex.Engine({
    resolution: {
        width: 256,
        height: 256,
    },
    viewport: {
        width: 800,
        height: 800
    },
    suppressPlayButton: true,
    antialiasing: false
});

game.start(loader).then(() => {
    console.log('Game start!');

    Resources.LdtkResource.registerEntityIdentifierFactory('PlayerStart', (props) => {
        const player = new Player({
            name: 'player',
            anchor: ex.vec(props.entity.__pivot[0],props.entity.__pivot[1]),
            width: props.entity.width,
            height: props.entity.height,
            pos: props.worldPos,
            z: props.layer.order
        });
        game.currentScene.camera.strategy.lockToActor(player);
        return player;
    });
    // Provide a type to the plugin to use for a specific entity identifier
    // Player.ts
    Resources.LdtkResource.addToScene(game.currentScene, {
        pos: ex.vec(0, 0),
        // levelFilter: ['Level_0']
    });
});