const path = require("path");

module.exports = {
 entry: {
    'excalibur-ldtk': './src/index.ts',
    'excalibur-ldtk.min': './src/index.ts',
 },
 module: {
   rules: [
     {
       test: /\.ts$/,
       use: 'ts-loader',
       exclude: /node_modules/
     },
     {
        test: [/\.tmx$/, /\.tsx$/],
        use: 'raw-loader'
     }
   ]
 },
 mode: 'development',
 devtool: 'source-map',
 devServer: {
   static: '.',
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
   filename: "[name].js",
   path: path.join(__dirname, "dist"),
   library: ["ex", "Plugin", "Ldtk"],
   libraryTarget: "umd"
 },
 optimization: {
   minimize: true,
 },
 externals: {
    "excalibur": {
       commonjs: "excalibur",
       commonjs2: "excalibur",
       amd: "excalibur",
       root: "ex"
   }
 },
 plugins: [
   //  new BundleAnalyzerPlugin()
 ]
};