/**
 * 模块路径解析
 * 1.标准路径：以设置的基址来查找模块
 * 2.相对路径： ./同级目录 ../上级目录   模块中相对当前模块(require和require.async) use中相对路径为普通路径,相对当前页面,同3
 * 3.普通路径：不做任何处理 直接加载该路径 以'http'或'/'开头
 *
 * @ptype：入口来源 //0 require    1 use
 */

function resolve(path, ptype, base){
    var _type = type(path);
    ptype = ptype || 0;
    
    if( _type == 'array' ){
        var rect = [], i;
        for( i=0; i<path.length; i++ ){
            rect.push( resolve(path[i], ptype, base) );
        }
        return rect;
    }
    if( _type != 'string' || !path.length ){
        return '';
    }

    //别名转化 
    //alias中最好不要使用相对路径
    var alias = Config.alias || {},       
    _path = path = alias[path] ? alias[path] : path;

    base = base || Loader.point || Config.base;
    
       
    if( /^(http|\/|file)/.test(path) ){//绝对路径
        return resolve.fix(path);//path+fix;
    }
    if( /^\.\//.test(path) ){// 以./开头 相对路径 同级目录
        if( ptype==1 ){//相对于当前页面
            path = path.replace(/^\.\//, '');
            return resolve.fix(path, _path);

        }else{//2种情况 './../a/b' 或者 './a/b'   相对于当前模块

            return relativePath(_path, base);
        }
    }
    
    if( !/^\.{2}\//.test(path) ){//标准路径
        return resolve.fix(Config.base+path, _path);
    }
    
    //相对路径 ../开头
    if( ptype==1 ){//相对当前页面
        return resolve.fix(path);
    }
    
    //require 以../开头的模块    
    return relativePath(path, base);
    
}

/*
 * 添加后缀
 * @uri:解析过得uri
 */
resolve.fix = function(uri){
    var fix = Config.fix,
        version = '';
        
    if( /\.(js|json)$|\?|#/.test(uri) ){
        uri = uri.replace(/#$/, '');//去掉末尾# 不需要添加后缀
        fix = '';
    }
    return uri + fix + version;
}

/**
 * require中相对模块转化为标准模块
 * @base: require所在模块
 */
function relativePath(path, base){
    var _path = path;
    path = path.replace(/^\.\//, '');

    //相对require所在模块   需先获取当前模块路径
    var p1 = path.indexOf('../'),
        p2 = path.lastIndexOf('../'),
        s = base.indexOf('http') == 0 ? 3 : 1,
        level = p2/3+1;

    if( p1 < 0 ){//适用于'./a/b' > 'a/b' 
        path = base.split('/').slice(0,-1).join('/')+'/'+path;
        return resolve.fix(path, _path);
    }
    
    base = base.split('/');
    path = path.replace(/^(\.{2}\/)+/,'');
    len = base.length;
    
    if( len>s && len>level ){
        for( i=0; i<level+1; i++ ){
            base.pop();
        }
        base = base.join('/');
        base = base=='' ? '' : base+'/';
    }else{
        path = s==3 ? base.join('/') : base[0]+'/'+path;
        return resolve.fix(path, _path);
    }
    path = base + path;
    return resolve.fix(path, _path);
}

