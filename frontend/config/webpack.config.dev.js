const autoprefixer = require("autoprefixer")
const webpack = require("webpack")
const HtmlWebpackPlugin = require("html-webpack-plugin")
// @ts-ignore
const CaseSensitivePathsPlugin = require("case-sensitive-paths-webpack-plugin")
const InterpolateHtmlPlugin = require("react-dev-utils/InterpolateHtmlPlugin")
const WatchMissingNodeModulesPlugin = require("react-dev-utils/WatchMissingNodeModulesPlugin")
const getClientEnvironment = require("./env")
const paths = require("./paths")

// Webpack uses `publicPath` to determine where the app is being served from.
// In development, we always serve from the root. This makes config easier.
const publicPath = "/"
// `publicUrl` is just like `publicPath`, but we will provide it to our app
// as %PUBLIC_URL% in `index.html` and `process.env.PUBLIC_URL` in JavaScript.
// Omit trailing slash as %PUBLIC_PATH%/xyz looks better than %PUBLIC_PATH%xyz.
const publicUrl = ""
// Get environment variables to inject into our app.
const env = getClientEnvironment(publicUrl)

module.exports = {
  mode: "development",
  // You may want 'eval' instead if you prefer to see the compiled output in DevTools.
  // See the discussion in https://github.com/facebookincubator/create-react-app/issues/343.
  devtool: "cheap-module-source-map",
  // export favicon logcation so we can reuse it in the production config
  // These are the "entry points" to our application.
  // This means they will be the "root" imports that are included in JS bundle.
  // The first two entry points enable "hot" CSS and auto-refreshes for JS.
  entry: [
    // Include an alternative client for WebpackDevServer. A client's job is to
    // connect to WebpackDevServer by a socket and get notified about changes.
    // When you save a file, the client will either apply hot updates (in case
    // of CSS changes), or refresh the page (in case of JS changes). When you
    // make a syntax error, this client will display a syntax error overlay.
    // Note: instead of the default WebpackDevServer client, we use a custom one
    // to bring better experience for Create React App users. You can replace
    // the line below with these two lines if you prefer the stock client:
    // require.resolve('webpack-dev-server/client') + '?/',
    // require.resolve('webpack/hot/dev-server'),
    require.resolve("react-dev-utils/webpackHotDevClient"),
    // Finally, this is your app's code:
    paths.appIndexTsx
    // We include the app code last so that if there is a runtime error during
    // initialization, it doesn't blow up the WebpackDevServer client, and
    // changing JS code would still trigger a refresh.
  ],
  output: {
    // Next line is not used in dev but WebpackDevServer crashes without it:
    path: paths.appBuild,
    // Add /* filename */ comments to generated require()s in the output.
    pathinfo: true,
    // This does not produce a real file. It's just the virtual path that is
    // served by WebpackDevServer in development. This is the JS bundle
    // containing code from all our entry points, and the Webpack runtime.
    filename: "static/js/bundle.js",
    // This is the URL that app is served from. We use "/" in development.
    publicPath: publicPath
  },
  resolve: {
    modules: ["node_modules", paths.appNodeModules, paths.appSrc],
    extensions: [".js", ".json", ".jsx", ".ts", ".tsx"],
    alias: {
      "@": paths.appSrc
    }
  },

  module: {
    rules: [
      // ** ADDING/UPDATING LOADERS **
      // The "url" loader handles all assets unless explicitly excluded.
      // The `exclude` list *must* be updated with every change to loader extensions.
      // When adding a new loader, you must add its `test`
      // as a new entry in the `exclude` list for "url" loader.

      // "url" loader embeds assets smaller than specified size as data URLs to avoid requests.
      // Otherwise, it acts like the "file" loader.
      {
        exclude: [
          /\.html$/,
          /\.(js|jsx)$/,
          /\.(ts|tsx)$/,
          /\.css$/,
          /\.(scss|sass)$/,
          /\.json$/,
          /\.svg$/,
          /\.png$/,
          /\.jpg$/
        ],
        loader: "url-loader",
        query: {
          limit: 10000,
          name: "static/media/[name].[hash:8].[ext]"
        }
      },
      {
        test: /\.(js|jsx)$/,
        include: paths.appSrc,
        use: {
          loader: "babel-loader",
          query: {
            // This is a feature of `babel-loader` for webpack (not Babel itself).
            // It enables caching results in ./node_modules/.cache/babel-loader/
            // directory for faster rebuilds.
            cacheDirectory: true,
            plugins: ["react-hot-loader/babel"]
          }
        }
      },
      {
        test: /\.(ts|tsx)$/,
        include: paths.appSrc,
        use: [
          {
            loader: "babel-loader",
            query: {
              // This is a feature of `babel-loader` for webpack (not Babel itself).
              // It enables caching results in ./node_modules/.cache/babel-loader/
              // directory for faster rebuilds.
              cacheDirectory: true,
              plugins: ["react-hot-loader/babel"]
            }
          },
          {
            loader: "ts-loader",
            options: {
              transpileOnly: true
            }
          }
        ]
      },
      // "postcss" loader applies autoprefixer to our CSS.
      // "css" loader resolves paths in CSS and adds assets as dependencies.
      // "style" loader turns CSS into JS modules that inject <style> tags.
      // In production, we use a plugin to extract that CSS to a file, but
      // in development "style" loader enables hot editing of CSS.
      {
        test: /\.css$/,
        use: [
          "style-loader",
          {
            loader: "css-loader",
            options: {
              importLoaders: 1
            }
          },
          {
            loader: "postcss-loader",
            options: {
              plugins: () => [
                // @ts-ignore
                require("postcss-flexbugs-fixes"),
                autoprefixer({
                  browsers: [
                    ">1%",
                    "last 4 versions",
                    "Firefox ESR",
                    "not ie < 9" // React doesn't support IE8 anyway
                  ],
                  // don't include unused previosu versons of the flexbox spec
                  flexbox: "no-2009"
                })
              ]
            }
          }
        ]
      },
      {
        test: /\.(scss|sass)$/,
        use: [
          "style-loader",
          {
            loader: "css-loader",
            options: {
              importLoaders: 1
            }
          },
          "sass-loader"
        ]
      },
      {
        test: /\.(svg|png|jpg)$/,
        use: {
          loader: "file-loader",
          query: {
            name: "static/media/[name].[hash:8].[ext]"
          }
        }
      }
      // ** STOP ** Are you adding a new loader?
      // Remember to add the new extension(s) to the "url" loader exclusion list.
    ]
  },
  plugins: [
    new InterpolateHtmlPlugin(HtmlWebpackPlugin, env.raw),
    new HtmlWebpackPlugin({
      template: paths.appHtml
    }),
    new webpack.DefinePlugin(env.stringified),
    new webpack.HotModuleReplacementPlugin(),
    new CaseSensitivePathsPlugin(),
    new WatchMissingNodeModulesPlugin(paths.appNodeModules)
  ],
  // Some libraries import Node modules but don't use them in the browser.
  // Tell Webpack to provide empty mocks for them so importing them works.
  node: {
    fs: "empty",
    net: "empty",
    tls: "empty"
  }
}
