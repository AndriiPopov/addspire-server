const path = require('path')
const CopyWebpackPlugin = require('copy-webpack-plugin')

const config = {
    // context: path.join(__dirname, 'src'),
    entry: {
        vendor: ['@babel/polyfill', 'react'], // Third party libraries
        index: ['./src/Components/entrypoints/index.js'],
        /// Every pages entry point should be mentioned here
    },
    output: {
        path: path.resolve(__dirname, 'public'), //destination for bundled output is under ./src/public
        filename: '[name].js', // names of the bundled file will be name of the entry files (mentioned above)
    },
    module: {
        rules: [
            {
                test: /\.(js|jsx)$/,
                use: {
                    loader: 'babel-loader', // asks bundler to use babel loader to transpile es2015 code
                    options: {
                        presets: ['@babel/preset-env', '@babel/preset-react'],
                    },
                },
                exclude: [/public/], ///node_modules/,
            },
        ],
    },
    resolve: {
        extensions: ['.js', '.jsx', '.json', '.wasm', '.mjs', '*'],
    }, // If multiple files share the same name but have different extensions, webpack will resolve the one with the extension listed first in the array and skip the rest.
    // plugins: [
    //     new CopyWebpackPlugin([
    //         {
    //             from: /task_modules\/bk-module-\w+-?\w+\/dist\/((?!node_modules|bower_components).)*.(js|css|html)$/,
    //             to: './dist/tasks/[name]/[name].[ext]',
    //         },
    //     ]),
    // ],
}

module.exports = config
