import { ImageSource, SpriteSheet } from "excalibur";
import { LdtkTilesetDefinition } from "./types";

export interface TilesetOptions {
    image: ImageSource,
    ldtkTileset: LdtkTilesetDefinition
}

export class Tileset {
    public readonly image: ImageSource;
    public readonly ldtkTileset: LdtkTilesetDefinition;
    public readonly spritesheet: SpriteSheet;
    constructor(options: TilesetOptions) {
        const {image, ldtkTileset} = options;
        this.image = image;
        this.ldtkTileset = ldtkTileset;
        this.spritesheet = SpriteSheet.fromImageSource({
            image,
            grid: {
                rows: ldtkTileset.pxHei / ldtkTileset.tileGridSize,
                columns: ldtkTileset.pxWid / ldtkTileset.tileGridSize,
                spriteHeight: ldtkTileset.tileGridSize,
                spriteWidth: ldtkTileset.tileGridSize
            }
        });
    }
}