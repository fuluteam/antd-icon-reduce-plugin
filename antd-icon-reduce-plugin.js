/**
 * @desc antd图标库体积优化插件
 * @author zhangkegui
 * @version 1.0
 */
var path = require('path');
var fs = require('fs');
var modulePackage = require('./package.json');

var isInNodeModules = modulePackage.name === 'antd-icon-reduce-plugin';
var projectDir = __dirname;
var tempFilePath = path.resolve(projectDir, 'antd-icon-reduce.js'); // 临时生成的图标导出文件
var loaderName = 'antd-icon-reduce-loader'; // 配套使用的loader，用于提取用到的icon
var relativePath = isInNodeModules ? '../' : 'node_modules';
var antdModulePath = path.resolve(projectDir, relativePath, 'antd'); // antd在项目中的绝对路径
var copyFilePath = '';
var iconFileRegx = /^antd-icon-reduce/;
var pluginOptions = null;
var savedIconFilePath = '';
var mode = '';
function isArray(arrLike) {
    return Object.prototype.toString.call(arrLike) === '[object Array]';
}

function AntdIconReducePlugin(options) {
    pluginOptions = options;
}

function deleteAllFile() {
    asyncIconFileToLocal();
    deleteFile();
    deleteFile(copyFilePath);
}
function asyncIconFileToLocal() {
    if (!fs.existsSync(savedIconFilePath)) {
        fs.writeFileSync(savedIconFilePath, '');
    }
    fs.copyFileSync(tempFilePath, savedIconFilePath);
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
    if (mode !== 'production' && fs.statSync(filePath).size <= 0) {
        return;
    }
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
    copyFilePath = path.resolve(projectDir, 'antd-icon-reduce-'+ Date.now() +'.js');
    createFile(copyFilePath);
    fs.copyFileSync(tempFilePath, copyFilePath);
    if (fs.existsSync(copyFilePath) && fs.statSync(copyFilePath).size > 0) {
        setIconAlisa(compiler, copyFilePath);
    }
}
function clearDirIconFile() {
    fs.readdirSync(projectDir).forEach(function(fileName) {
        if (iconFileRegx.test(fileName)
        && fileName !== 'antd-icon-reduce-plugin.js'
        && fileName !== 'antd-icon-reduce-loader.js') {
            deleteFile(path.resolve(projectDir, fileName));
        }
    });
}
AntdIconReducePlugin.prototype.apply = function(compiler) {
    mode = process.env.NODE_ENV || compiler.options.mode;
    var _pluginOptions = pluginOptions || {};
    if ('development' in _pluginOptions && !_pluginOptions.development && mode === 'development') {
        return;
    }
    var initIcons = [];
    if (isArray(_pluginOptions.icons)) {
        initIcons = _pluginOptions.icons;
    }
    if (_pluginOptions.iconFilePath) {
        savedIconFilePath = _pluginOptions.iconFilePath;
    }
    if (mode === 'production' && fs.existsSync(savedIconFilePath)) {
        setIconAlisa(compiler, savedIconFilePath);
        return;
    }
    clearDirIconFile();
    createTempFile();
    setIconAlisa(compiler);
    var rules = compiler.options.module.rules;
    rules.forEach(function(ruleItem) {
        if (isArray(ruleItem.use)) {
            for (var i = 0; i < ruleItem.use.length; i++) {
                if (ruleItem.use[i] === loaderName) {
                    ruleItem.use[i] = {
                        loader: loaderName,
                        options: {
                            initIcons: initIcons,
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
                initIcons: initIcons,
                filePath: tempFilePath,
            },
        }]
    });
    compiler.hooks.make.tap('antd-icon-reduce-make', function(compilation) {
        if (mode !== 'production') {
            buildPluginFile(compilation);
            asyncIconFileToLocal();
        }
    });
    compiler.hooks.emit.tap('antd-icon-reduce-emit', function(compilation) {
        if (mode === 'production') {
            buildPluginFile(compilation);
        }
    });
    compiler.hooks.done.tap('antd-icon-reduce-done', function() {
        if (mode === 'production') {
            deleteAllFile();
        } else {
            asyncIconFileToLocal();
        }
    });
    compiler.hooks.watchClose.tap('antd-icon-reduce-close', function(compilation) {
        deleteAllFile();
    });
};

module.exports = AntdIconReducePlugin;