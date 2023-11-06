import { LdtkResource } from '@excalibur-ldtk';
import * as ex from "excalibur";

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

const player = new ex.Actor({
    color: ex.Color.Red,
    width: 16,
    height: 16,
    pos: ex.vec(100, 100)
});

game.add(player);


game.start(loader).then(() => {
    console.log('Game start!');
    ldtkResource.parse(game.currentScene);
});