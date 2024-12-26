import { ImageFiltering, ImageSource, Loader } from "excalibur";
import { LdtkResource } from '@excalibur-ldtk';

export const Resources = {
    HeroSpriteSheetPng: new ImageSource('./Solaria Demo Pack Update 03/Solaria Demo Pack Update 03/16x16/Sprites/Hero 01.png'),
    LdtkResource: new LdtkResource('./spacing-padding/spacing-padding.ldtk', {
        useTilemapCameraStrategy: true,
        useMapBackgroundColor: true,
    }),
    LdtkAutoTile: new LdtkResource('./autotile/autotile.ldtk', {
        useMapBackgroundColor: true,
    }),
    LdtkPureAutoTile: new LdtkResource('./dsml1/dsml1.ldtk', {
        useMapBackgroundColor: true,
    })
} as const;


export const loader = new Loader();
for (let resource of Object.values(Resources)) {
    loader.addResource(resource);
}