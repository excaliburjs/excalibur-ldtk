
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

    Resources.LdtkResource.registerEntityIdentifierFactory('PlayerStart', (props) => {
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
    Resources.LdtkResource.addToScene(game.currentScene, {
        pos: ex.vec(0, 0),
        levelFilter: ['Level_0', 'Level_1']
    });
    const player = game.currentScene.world.entityManager.getByName('player')[0];
    if (player instanceof Player) {
        game.currentScene.camera.clearAllStrategies();
        game.currentScene.camera.strategy.lockToActor(player);
        const bounds = Resources.LdtkResource.getLevelBounds(['Level_0', 'Level_1']);
        game.currentScene.camera.strategy.limitCameraBounds(bounds);
    }
});