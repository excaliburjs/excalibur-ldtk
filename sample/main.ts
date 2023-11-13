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
    antialiasing: false
});
const ldtkResource = new LdtkResource('./top-down.ldtk');

const loader = new ex.Loader([ldtkResource]);

game.start(loader).then(() => {
    console.log('Game start!');

    ldtkResource.registerEntityType('PlayerStart', Player);
    // Provide a type to the plugin to use for a specific entity identifier
    // Player.ts
    ldtkResource.parse(game.currentScene);

});