import { z } from 'zod';



const LdtkTilesetRectangle = z.object({
    h: z.number(),
    tilesetUid: z.number(),
    w: z.number(),
    x: z.number(),
    y: z.number()
});
const LdtkPixel = z.tuple([z.number(), z.number()]);
const LdtkFieldInstance = z.object({
    __identifier: z.string(),
    __tile: LdtkTilesetRectangle.nullable(),
    __type: z.string(),//z.union([z.literal('Int'), z.literal('Float'), z.literal('String'), z.literal('Bool'), z.literal('Enum')]), // TODO this might not work with ENUM
    __value: z.any(),
    defUid: z.number()
})
const LdtkTileInstance = z.object({
    a: z.number(),
    f: z.number(), // 2-bit int 0bXY flip
    px: LdtkPixel,
    src: LdtkPixel,
    t: z.number()
});

export const LdtkEntityInstance = z.object({
    __grid: LdtkPixel,
    __identifier: z.string(),
    __pivot: LdtkPixel,
    __smartColor: z.string(),
    __tags: z.array(z.string()),
    __tile: LdtkTilesetRectangle,
    __worldX: z.number().nullable(),
    __worldY: z.number().nullable(),
    defUid: z.number(),
    fieldInstances: z.array(LdtkFieldInstance),
    height: z.number(),
    iid: z.string(),
    px: LdtkPixel,
    width: z.number()
});
export type LdtkEntityInstance = z.infer<typeof LdtkEntityInstance>;

export const LdtkLayerInstance = z.object({
    __cHei: z.number(),
    __cWid: z.number(),
    __gridSize: z.number(),
    __identifier: z.string(),
    __opacity: z.number(),
    __pxTotalOffsetX: z.number(),
    __pxTotalOffsetY: z.number(),
    __tilesetDefUid: z.number().nullable(),
    __tilesetRelPath:z.string().nullable(),
    __type: z.union([z.literal('IntGrid'), z.literal('Entities'), z.literal('Tiles'), z.literal('AutoLayer')]),
    autoLayerTiles: z.array(LdtkTileInstance), // only in auto layers
    entityInstances: z.array(LdtkEntityInstance),// only in entity layers
    gridTiles: z.array(LdtkTileInstance),
    iid: z.string(),
    intGridCsv: z.array(z.number()), // __cWid x __cHei, 0 means empty, values start at 1
    layerDefUid: z.number(),
    levelId: z.number(),
    overrideTilesetUid: z.number().nullable(),
    pxOffsetX: z.number(),
    pxOffsetY: z.number(),
    visible: z.boolean()
});
export type LdtkLayerInstance = z.infer<typeof LdtkLayerInstance>;

export const LdtkLevel = z.object({
    __bgColor: z.string().nullable(),
    bgColor: z.string().nullable(),
    __bgPos: z.object({
        cropRect: z.array(z.tuple([z.number(), z.number(), z.number(), z.number()])), // cropX, cropY, cropWidth, cropHeight
        scale: z.tuple([z.number(), z.number()]),
        topLeftPx: LdtkPixel
    }).nullable(),
    __neighbours: z.array(z.object({
        dir: z.union([z.literal('n'), z.literal('s'), z.literal('w'), z.literal('e'), z.literal('ne'), z.literal('nw'), z.literal('se'), z.literal('sw'), z.literal('o'), z.literal('<'), z.literal('>')]),
        levelIid: z.string()
    })),
    bgRelPath: z.string().nullable(),
    externalRelPath: z.string().nullable(),
    fieldInstances: z.array(LdtkFieldInstance),
    identifier: z.string(),
    iid: z.string(),
    layerInstances: z.array(LdtkLayerInstance).nullable(), // null if the save levels separately is enabled
    pxHei: z.number(),
    pxWid: z.number(),
    uid: z.number(),
    worldDepth: z.number(),
    worldX: z.number(),
    worldY: z.number()
});
export type LdtkLevel = z.infer<typeof LdtkLevel>;

const LdtkWorld = z.object({
    identifier: z.string(),
    iid: z.string(),
    levels: z.array(LdtkLevel),
    worldGridHeight:z.number(),
    worldGridWidth: z.number(),
    // TODO is this a typo Vania?
    worldLayout: z.union([z.literal('Free'), z.literal('GridVania'), z.literal('LinearHorizontal'), z.literal('LinearVertical')]),
});
export type LdtkWorld = z.infer<typeof LdtkWorld>;

const LdtkEnumValueDefinition = z.object({
    color: z.number(),
    id: z.string(),
    tileRect: LdtkTilesetRectangle.nullable()
});

const LdtkEnumDefinition = z.object({
    externalRelPath: z.string().nullable(),
    iconTilesetUid: z.number().nullable(),
    identifier: z.string(),
    tags: z.array(z.string()),
    uid: z.number(),
    values: z.array(LdtkEnumValueDefinition)
})

export type LdtkEnumDefinition = z.infer<typeof LdtkEnumDefinition>;

const LdtkTilesetDefinition = z.object({
    __cHei: z.number(),
    __cWid: z.number(),
    customData: z.array(z.object({
        data: z.string(),
        tileId: z.number()
    })),
    embedAtlas: z.string().nullable(),
    enumsTags: z.optional(z.array(z.object({
        enumValueId: z.string(),
        tileIds: z.array(z.number())
    }))),
    identifier: z.string(),
    padding: z.number(),
    pxHei: z.number(),
    pxWid: z.number(),
    relPath: z.string().nullable(),
    spacing: z.number(),
    tags: z.array(z.string()),
    tagsSourceEnumUid: z.number().nullable(),
    tileGridSize: z.number(),
    uid: z.number()
})
export type LdtkTilesetDefinition = z.infer<typeof LdtkTilesetDefinition>;

export const LdtkLayerDefinition = z.object({
    __type: z.union([z.literal("IntGrid"), z.literal("Entities"), z.literal("Tiles"), z.literal("AutoLayer")]),
    autoSourceLayerDefUid: z.number().nullable(),
    displayOpacity: z.number(),
    gridSize: z.number(),
    identifier: z.string(),
    intGridValues: z.array(z.object({
        color: z.string(),
        groupUid: z.number(),
        identifier: z.string().nullable(),
        tile: LdtkTilesetRectangle.nullable(),
        value: z.number()
    })),
    intGridValuesGroups: z.array(z.object({
        color: z.string().nullable(),
        identifier: z.string().nullable(),
        uid: z.number()
    })),
    parallaxFactorX: z.number(),
    parallaxFactorY: z.number(),
    parallaxScaling: z.boolean(),
    pxOffsetX: z.number(),
    pxOffsetY: z.number(),
    tilesetDefUid: z.number().nullable(),
    uid: z.number(),
});
export type LdtkLayerDefinition = z.infer<typeof LdtkLayerDefinition>;

export const LdtkEntityDefinition = z.object({
    color: z.string(),
    height: z.number(),
    identifier: z.string(),
    nineSliceBorders: z.array(z.number()),
    pivotX: z.number(),
    pivotY: z.number(),
    tileRect: LdtkTilesetRectangle,
    tileRenderMode: z.union([
        z.literal("Cover"),
        z.literal("FitInside"),
        z.literal("Repeat"),
        z.literal("Stretch"),
        z.literal("FullSizeCropped"),
        z.literal("FullSizeUncropped"),
        z.literal("NineSlice")
    ]),
    tilesetId: z.number().nullable(),
    uiTileRect: LdtkTilesetRectangle.nullable(),
    uid: z.number(),
    width: z.number()
});
export type LdtkEntityDefinition = z.infer<typeof LdtkEntityDefinition>;

const LdtkDefinitions = z.object({
    tilesets: z.array(LdtkTilesetDefinition),
    enums: z.array(LdtkEnumDefinition),
    layers: z.array(LdtkLayerDefinition),
    entities: z.array(LdtkEntityDefinition)
})
export type LdtkDefinitions = z.infer<typeof LdtkDefinitions>;

export const LdtkProjectMetadata = z.object({
    iid: z.string(),
    bgColor: z.string().nullable(),
    defs: LdtkDefinitions,
    externalLevels: z.boolean(),
    jsonVersion: z.string(),
    levels: z.array(LdtkLevel),
    toc: z.array(z.object({
        identifier: z.string(),
        instancesData: z.array(z.object({
            fields: z.any(),
            heiPx: z.number(),
            iids: z.string(),
            widPix: z.number(),
            worldX: z.number(),
            worldY: z.number()
        }))
    })),
    // Moving to worlds array
    worldGridHeight: z.number().nullable(),
    worldGridWidth: z.number().nullable(),
    // TODO is this a LDtk docs typo Vania?
    worldLayout: z.union([z.literal('Free'), z.literal('GridVania'), z.literal('LinearHorizontal'), z.literal('LinearVertical')]).nullable(),
    worlds: z.array(LdtkWorld)
});
export type LdtkProjectMetadata = z.infer<typeof LdtkProjectMetadata>;



