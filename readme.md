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
        icons: ['download', { type: 'up', theme: 'outline' }, ...], // 自定义需要加入的图标,支持字符串和对象两种写法，默认为[]
    	development: true, // 是否在开发环境模式下运行，默认为true
    }),
    ...
]
```

### 注意事项

* 插件只能处理使用字符串字面量来定义Icon类型，使用变量或者其他赋值方式将会被忽略，只有如下两种方式可以被识别:

1.字符串字面量直接定义
```
<Icon type="down" />
```
2.三元符
```
const isUp = true;

<Icon type={isUp ? 'up' : 'down'}

```

* 在其他未识别的情况下，需要通过插件的icons属性手动传入图标。


