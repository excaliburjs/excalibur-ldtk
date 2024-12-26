
import * as ex from "excalibur";
import { Player } from './player';
import { Resources, loader } from "./resources";
ex.Flags.useLegacyImageRenderer();
const game = new ex.Engine({
    resolution: {
        width: 256,
        height: 256,
    },
    suppressPlayButton: false,
    pixelArt: true,
    pixelRatio: 4,
    displayMode: ex.DisplayMode.FitScreen,
});

game.start(loader).then(() => {
    console.log('Game start!');

    Resources.LdtkAutoTile.addToScene(game.currentScene, {
        pos: ex.vec(0, 0)
    });
});