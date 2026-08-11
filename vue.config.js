const path = require('path')

module.exports = {
  // Highcharts 11 ships optional chaining and nullish coalescing in its UMD bundle, which
  // webpack 4's parser cannot read. Routing it through babel-loader downlevels both.
  transpileDependencies: ['highcharts'],
  configureWebpack: {
    resolve: {
      alias: {
        '@': path.resolve(__dirname, 'src')
      }
    }
  },
  css: {
    loaderOptions: {
      sass: {
        additionalData: '@use "~@/assets/scss/_tokens.scss" as *;'
      }
    }
  }
}
