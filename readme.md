## antd图标按需加载插件

### 简介
#### 本插件适用于antd的3.x版本，在3.x版本中，会将图标库全部打包输出，这无疑会极大增加最终的资源体积，因此该插件的目标旨在按需加载图标资源，将图标输出的体积大大降低

### 使用说明
#### 1.安装依赖：npm i antd-icon-reduce-plugin antd-icon-reduce-loader -D
#### 2.修改webpack配置
```
var AntdIconReducePlugin = require('antd-icon-reduce-plugin');

...
 module: {
    rules: [{
        test: /\.js(x)?$/,
            exclude: /node_modules/,
            use: ["antd-icon-reduce-loader", "babel-loader"] // 请根据实际情况配置，这里只需要将项目源代码匹配给antd-icon-reduce-loader即可
        }
    ],
},

...
plugins: [
    new AntdIconReducePlugin({
    	development: true, // 是否在开发环境模式下运行，默认为true
    }),
    ...
]
```
