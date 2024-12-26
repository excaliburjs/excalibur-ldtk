const path = require("path")
module.exports = {
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
  entry: {
    sample: './sample/main.ts',
    autotile: './sample/autotile.ts',
    pureautotile: './sample/pureautotile.ts',
  },
  output: {
    filename: '[name]/[name].js',
    path: path.resolve(__dirname, 'sample'),
    libraryTarget: "umd"
  },
};