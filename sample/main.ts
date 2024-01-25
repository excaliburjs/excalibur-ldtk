import { LdtkResource } from '@excalibur-ldtk';
import * as ex from "excalibur";
import { Player } from './player';

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
const ldtkResource = new LdtkResource('./top-down.ldtk');

const loader = new ex.Loader([ldtkResource]);

game.start(loader).then(() => {
    console.log('Game start!');

    ldtkResource.registerEntityIdentifierFactory('PlayerStart', (props) => {
        const player = new Player({
            name: 'player',
            anchor: ex.vec(props.entity.__pivot[0],props.entity.__pivot[1]),
            width: props.entity.width,
            height: props.entity.height,
            pos: props.worldPos,
            z: props.layer.order
        });
        return player;
    });
    // Provide a type to the plugin to use for a specific entity identifier
    // Player.ts
    ldtkResource.addToScene(game.currentScene);
});