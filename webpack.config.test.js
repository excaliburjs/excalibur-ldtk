const path = require("path")
module.exports = {
 entry: './sample/main.ts',
 mode: 'development',
 devtool: 'source-map',
 devServer: {
   static: '.',
 },
 module: {
   rules: [
     {
       test: /\.ts$/,
       use: 'ts-loader',
       exclude: /node_modules/
     }
   ]
 },
 resolve: {
   fallback: {
      fs: false
   },
   extensions: [".ts", ".js"],
   alias: {
      "@excalibur-ldtk": path.resolve(__dirname, './src/')
   }
 },
 output: {
   filename: './sample/main.js',
   path: __dirname,
   libraryTarget: "umd"
 }
};