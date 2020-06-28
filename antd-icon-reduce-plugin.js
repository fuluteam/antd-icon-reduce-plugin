/**
 * @desc antd图标库体积优化插件
 * @author zhangkegui
 * @version 1.0
 */
const path = require('path');
const fs = require('fs');

const projectDir = __dirname;
const tempFilePath = path.resolve(projectDir, 'antd-icon-reduce.js'); // 临时生成的图标导出文件
const loaderName = 'antd-icon-reduce-loader'; // 配套使用的loader，用于提取用到的icon
let relativePath = projectDir.indexOf('node_modules') >= 0 ? '../node_modules' : 'node_modules';
const antdModulePath = path.resolve(__dirname, relativePath, 'antd'); // antd在项目中的绝对路径
let copyFilePath = '';
let pluginOptions = null;
function isArray(arrLike) {
    return Object.prototype.toString.call(arrLike) === '[object Array]';
}

function AntdIconReducePlugin(options) {
    pluginOptions = options;
}

function deleteAllFile() {
    deleteFile();
    deleteFile(copyFilePath);
}

function deleteFile(filePath = tempFilePath) {
    if (filePath && fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
    }
}
function createTempFile() {
    createFile(tempFilePath);
}
function createFile(filePath) {
    if (!fs.existsSync(filePath)) {
        fs.writeFileSync(filePath, '');
    }
}
function setIconAlisa(compiler, filePath = tempFilePath) {
    if (!compiler.options.resolve) {
        compiler.options.resolve = {
            alias: {
                '@ant-design/icons/lib/dist$': filePath,
            }
        };
    } else if (!compiler.options.resolve.alias) {
        compiler.options.resolve.alias = {
            '@ant-design/icons/lib/dist$': filePath,
        };
    } else {
        compiler.options.resolve.alias['@ant-design/icons/lib/dist$'] = filePath;
    }
}
function buildPluginFile(compiler) {
    if (copyFilePath && fs.existsSync(copyFilePath)) {
        fs.unlinkSync(copyFilePath);
    }
    copyFilePath = path.resolve(projectDir, 'icon-reduce-'+ Date.now() +'.js');
    createFile(copyFilePath);
    fs.copyFileSync(tempFilePath, copyFilePath);
    if (fs.existsSync(copyFilePath) && fs.statSync(copyFilePath).size > 0) {
        setIconAlisa(compiler, copyFilePath);
    }
}
AntdIconReducePlugin.prototype.apply = function(compiler) {
    var mode = process.env.NODE_ENV || compiler.options.mode;
    var { development = true } = pluginOptions || {};
    if (!development && mode === 'development') {
        return;
    }
    createTempFile();
    if (mode === 'development') {
        setIconAlisa(compiler);
    }
    const rules = compiler.options.module.rules;
    rules.forEach(function(ruleItem) {
        if (isArray(ruleItem.use)) {
            for (var i = 0; i < ruleItem.use.length; i++) {
                if (ruleItem.use[i] === loaderName) {
                    ruleItem.use[i] = {
                        loader: loaderName,
                        options: {
                            filePath: tempFilePath, // 给loader添加临时路径配置
                        },
                    };
                    i = ruleItem.use.length;
                }
            }
        }
    });
    // 添加专门匹配antd依赖包的loader配置
    rules.push({
        test: (filePath) => {
            if (filePath.indexOf(antdModulePath) >= 0 && path.extname(filePath) === '.js') {
                return true;
            }
            return false;
        },
        use: [{
            loader: "antd-icon-reduce-loader",
            options: {
                filePath: tempFilePath, 
            },
        }]
    });
    compiler.hooks.make.tap('antd-icon-reduce-make', function(compiler) {
        if (mode !== 'production') {
            buildPluginFile(compiler);
        }
    });
    compiler.hooks.emit.tap('antd-icon-reduce-emit', function(compiler) {
        if (mode === 'production') {
            buildPluginFile(compiler);
        }
    });
    compiler.hooks.done.tap('antd-icon-reduce-done', function() {
        if (mode === 'production') {
            deleteAllFile();
        }
    });
    compiler.hooks.watchClose.tap('antd-icon-reduce-close', function(compilation) {
        deleteAllFile();
    });
};

module.exports = AntdIconReducePlugin;