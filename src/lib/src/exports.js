
//将所依赖模块转换成对应的接口
function depsToExports(mods){
    var _mod, j, rect = [];
    if( !mods ){
        return rect;
    }
    for( j=0; j<mods.length; j++ ){
        _mod = Modules[mods[j]];
        
        if( !_mod ){
            continue;
        }  
        getExports(_mod);
        rect.push(_mod.exports);        
    }
    return rect;
}

//获取单模块的数据接口
function getExports(mod){
    if( mod.init ){
        return mod.exports;
    }
    //mod.init = 1;
    mod.exports = mod.exports===undefined ? 
            ( type(mod.factory)=='function' ? getExports.run(mod) : mod.factory ) || {} : 
            mod.exports;
            
    return mod.exports;
}

//执行工厂函数 获取接口
getExports.run = function(mod){
    var exports = {}, args = [require, exports, mod], ID = mod.id;
    /*
     * 引入依赖模块
     * 同步模式：实际上该模块在外部模块的定义中已经被提前加载到页面中
     * 这里只是获取数据接口
     */
    function require( id ){
        var mod;
        id = resolve(id, 0, ID);
        mod = Modules[id];
        return mod && getExports(mod);
    }
    require.async = function(){//按需加载模块
        var _mod = arguments[0],
            call = arguments[1],
            options = arguments[2] || {};
        options.async = ID;
        use(_mod ,call, options);
    }
    var returnExprots = mod.factory.apply( null, args ),

    Exports = returnExprots || //通过return返回接口
        mod.exports || //通过给module对象的exports属性赋值
        exports //直接在此空对象上添加属性

    delete mod.factory;
    
    return Exports;
}

