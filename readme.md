# Excalibur LDtk Plugin

This extension adds support for LDtk tile maps from https://ldtk.io/ in Excalibur!

This plugin supports the latest released version of LDtk, currently 1.5.3.

## Installation

```sh
npm install @excaliburjs/plugin-ldtk
```

Create your resource, load it, then add it to your scene!

```typescript

const game = new ex.Engine({...});

const ldtkMap = new LdtkResource('./path/to/my/cool-map.ldtk');

const loader = new ex.Loader([ldtkMap]);

game.start(loader).then(() => {
    ldtkMap.addToScene(game.currentScene);
});
```

Read the full documentation at https://excaliburjs.com/docs/ldtk-plugin


## Local Development

* Using [nodejs](https://nodejs.org/en/) and [npm](https://www.npmjs.com/)
* Run the `npm install` to install dependencies
* Run the `npm run start` to run the development server to test out changes

## Building bundles

* Run `npm run start` to produce javascript bundles for debugging in the `dist/` folder
* Run `npm run build` to produce javascript bundles for production (minified) in the `dist/` folder