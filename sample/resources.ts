import { ImageFiltering, ImageSource, Loader } from "excalibur";
import { LdtkResource } from '@excalibur-ldtk';

export const Resources = {
    HeroSpriteSheetPng: new ImageSource('./Solaria Demo Pack Update 03/Solaria Demo Pack Update 03/16x16/Sprites/Hero 01.png', false, ImageFiltering.Pixel),
    LdtkResource: new LdtkResource('./top-down.ldtk')
} as const;


export const loader = new Loader();
for (let resource of Object.values(Resources)) {
    loader.addResource(resource);
}