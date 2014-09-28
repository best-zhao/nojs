/**
 * noJS模块管理
 * 2014-08-22
 * @nolure@vip.qq.com
 *  
 */
(function(window, undefined) {

if( window.noJS ){
    return;
}

var noJS = window.noJS = {
    version : '2.0'
},
Config = {
    fix : '.js'
},
/**
 * Modules : {id:data} 模块缓存
 *     data:{uri:完整路径,
 *      bid:分支id,
 *      factory:工厂函数,
 *      exports:对外接口,
 *      cmd:是否标准模块,
 *      deps:依赖模块,
 *      state:1加载完成
 *     }
 */
Modules = {},

/**
 * Branch : {id:data,length:0} 分支
 *     length:用于记录分支数 递增
 *     data:{
 *      branches:当前分支数,
 *      callback:回调
 *     }
 */
Branch = [],

head = document.getElementsByTagName("head")[0];
    
//检测对象类型    
function type( obj ){       
    return obj == null ? String( obj ) : Object.prototype.toString.call( obj ).slice( 8, -1 ).toLowerCase();
}  

//检测分支是否完成
Branch.check = function(id, step){
    var branch = Branch[id];
    if( !branch ){
        return;
    }
    var branches = branch.branches += step - 1;
    if( branches <= 0 ){
        //获取分支起始模块接口
        var exports = depsToExports(branch.modules);
        branch.callback && branch.callback(exports);

        Branch[id] = null;

    }

}

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


/**
 * 模块加载
 *      模块缓存
 *      待加载队列 [files, callback, options]
 *      分支管理 从.use方法起始为一条新的分支
 *      模块加载 - 过滤重复模块
 *      define 确定当前正在加载的模块与之匹配 构建后直接使用第二个参数获取所依赖列表 
 *          [下载完成 - 代码执行(define，合并后define会执行多次) - 模块就绪(此处绑定一个回调，确定下个子分支)] 
 */

function Loader(item){
    var files = item[0],
        callback = item[1],
        options = item[2] || {},
        length = files.length,
        complete = 0,
        bid = options.bid,
        i, file;

    for( i=length-1; i>=0; i-- ){
        file = files[i];

        //清除已存在模块
        if( Modules[file] ){
            files.splice(i,1);
            length--;

            //end函数中会和complete比较
            complete--;
            end(null, 1, file, 1);

        }else{
            Modules[file] = {id:file, bid:bid};
        }
    }

    length = files.length;

    //全部为重复模块
    if( !length ){
        return;
    }

    append(files[0]);

    //添加到页面
    function append(file){
        if( !file ){
            return;
        }
        Loader.point = file;
        //创建script
        var s = document.createElement("script");
        s.async = true;
        
        Loader.event( s, function(){
            //模块下载并执行完毕 
            typeof Modules[file].success=='function' && Modules[file].success();
            end(this, 1, file);
        }, function(){
            end(this,2 , file);
        })
        s.src = file;
        head.appendChild(s);//插入文件到head中
    }

    /*
     * 单个文件载入完毕
     * @state:1成功，2失败
     */
    function end(script, state, file, repeat){
        complete++;

        /**
         * 每完成一个模块都要检测一次分支数（除首次加载的模块外，因为会在define中检测一次） 只针对2种情况：
         * 1. 重复模块
         * 2. 非标准模块 不能执行define
         */
        (repeat || !Modules[file].cmd) && Branch.check(bid, 0);

        //该模块已完全就绪
        Modules[file].state = 1;

        if( complete>=length ) {

            callback && callback();

            //该队列文件全部加载完毕 开始下一队列
            Loader.state = null;
            Loader.begin();

        }else{
            script && append(files[complete]);
        }

    }
}

//保存文件队列
Loader.fileItem = [];

//当前指向的模块
Loader.point = null;

Loader.state = null;


 /*
 * 添加新文件及回调到队列组
 * @files:Array
 * @callback:文件加载完后回调
 * @options:文件配置信息，包括路径和后缀等，不设置则使用默认配置
 *     options.front:添加顺序，默认是往队列后面追加 /  true表示添加到队列最前面，提前加载
 */
Loader.push = function(files, callback, options){
    if( type(files)=='array' && files.length ){
        Loader.fileItem[options && options.front ? 'unshift':'push']([files, callback, options]);
        Loader.begin();
    }
}


Loader.begin = function(){
    if( Loader.state || !Loader.fileItem.length ){
        return;
    }
    Loader.state = true;
    Loader(Loader.fileItem.shift());
}

Loader.event = function(script, success, error){
    script.onload = script.onreadystatechange = function(){
        if( /^(?:loaded|complete|undefined)$/.test(this.readyState) ){
            success && success.call(this);
            call(this);
        }
    }
    script.onerror = function(){
        error && error.call(this);
        call(this);
    }
    function call(s){
        s.onreadystatechange = s.onload = s.onerror = null;
        head.removeChild(s);//载入完毕后清除script标记
    }
}

/*
 * 模块定义define(id, deps, factory)
 * @factory:工厂函数 提供一个参数require来引入模块 并返回数据接口
 *
 * define每执行一次会做一次分支数检测
 * 合并压缩后，可能会存在多个define存在一个文件中 
 */
window.define = function(){

    var args = Array.prototype.slice.call(arguments),
        factory = args.slice(-1)[0],

        //使用构建工具自动提取依赖模板作为第二个参数
        deps = args.length>2 && args[1],

        _type = type( factory ),

        //当前载入模块的uri
        id = args.length>2 && typeof args[0]=='string' ? resolve(args[0], 0, Config.base) : Loader.point,
        currentMod = Modules[id],

        //主模块
        mainMod = Modules[Loader.point],
        length, 
        bid = mainMod.bid;
    
    if( !currentMod ){

        //合并的模块此时还未初始化 所以currentMod暂时不存在
        if( id && id!=Loader.point ){
            currentMod = Modules[id] = {
                id : id,
                bid : mainMod.bid,
                state : 1
            }
        }else{
            return;
        }        
    }
    currentMod.factory = factory;
    currentMod.cmd = 1;//标示标准模块

    if( _type=='function' ){

        if( !deps ){
            //手动解析内部所有require并提前载入
            deps = parseRequire( factory.toString() );
        }

        length = deps.length;

        //保存一致性 统一转化为完整路径
        deps = resolve(deps, 0, id);
        currentMod.deps = deps;

        //主模块
        if( id == Loader.point ){

            //该数组记录除了打包合并的模块外，剩下还需要加载的模块 
            //如打包设置为只有相对路径模块 则其他标准路径的模块就需要保存此处
            mainMod._deps = [].concat(deps);

            //为模块添加一个成功载入的回调 会在Loader end中执行
            mainMod.success = function(){
                var n = mainMod._deps.length;
                
                //主模块完成后检测分支 
                Branch.check(bid, n);

                for( var i=n-1;i>=0; i-- ){

                    //这里剩余的每个模块将单独插入到队列中 因为这些模块可能会存在相互的合并关系
                    Loader.push([mainMod._deps[i]], null, {
                        bid : bid,

                        //提高依赖模块的优先加载顺序 front:true
                        front : true
                    });
                }

                delete mainMod._deps;
                delete mainMod.success;
            }   
        }else{

            //筛选后 剩下的模块就是需要加载的依赖模块
            //id != Loader.point表示该模块为合并到主模块中的其他模块
            var i = 0, mainDeps = mainMod._deps, n = mainDeps.length;
            for( ; i<n; i++ ){
                if( id == mainDeps[i] ){
                    mainDeps.splice(i, 1);
                    break;
                }
            }
        }        
    }else{
        currentMod.exports = factory;
        //分支数-1
        Branch.check(bid, 0);
    }    
}

define.cmd = {};

function parseRequire( code ){
    var ret = [],
        REQUIRE_RE = /"(?:\\"|[^"])*"|'(?:\\'|[^'])*'|\/\*[\S\s]*?\*\/|\/(?:\\\/|[^\/\r\n])+\/(?=[^\/])|\/\/.*|\.\s*require|(?:^|[^$])\brequire\s*\(\s*(["'])(.+?)\1\s*\)/g,
        SLASH_RE = /\\\\/g;
    
    //bug:如代码中包含/和正则(且正则内容含有\/) 就会造成冲突 匹配不到模块   
    //解决：可先替换掉所有的'/'为'%2F'后再匹配
        
    code.replace( SLASH_RE, '').replace(/\//g, '%2F').replace( REQUIRE_RE, function( m, m1, m2 ) {
        m2 && ret.push(m2.replace(/%2F/g,'/'));
    })
    return ret;
}
//模块配置
noJS.config = function(options){    

    for( var i in options ){
        //同时将配置项挂在noJS.config上使外部可调用
        noJS.config[i] = Config[i] = options[i];
    }
    
    //配置全局模块 
    use(options.global, null, {front:true});

    return noJS;
}



/**
 * path: 模块String 多个用逗号隔开
 */
function use(path, callback, options){
    
    if( use.defer ){
        use.defer.push(Array.prototype.slice.call(arguments));
        return noJS;
    }
    
    if( !path || typeof path!='string' ){return noJS;}
    

    function call( exports ){
        callback && callback.apply(null, exports);
    }
    path = path.split(',');
       
        
    if( type(callback)=='object' ){//无回调,参数2作为3使用
        options = callback;
        callback = null;
    }
    options = options || {};

    //保存所依赖模块 
    //require.async 通过opt.async可获取当前所在模块的id
    var base = options.async;
    path = resolve(path, base ? 0 : 1, base);

    var deps = [].concat( path );

    //创建一个分支
    var bid = Branch.length++;
    Branch[bid] = {
        //此回调作为整个分支的回调 
        callback : call,
        modules : deps,
        branches : path.length
    }
    options.bid = bid;
    //options.deps = deps;

    Loader.push(path, null, options);
    return noJS;
}

//载入配置文件时 use动作暂存此处
//use.defer = [];

noJS.use = use;

var _css = {};
noJS.css = function(url){
    var t = type(url);
    if( t=='array' ){
        for( var i=0; i<url.length; i++ ){
            noJS.css(url[i]);
        }   
        return noJS;
    }
    if( t != 'string' || _css[url] ){
        return noJS;
    }
    var link = document.createElement('link');
    link.href = url;
    link.setAttribute('rel', 'stylesheet');
    head.appendChild(link);
    _css[url] = 1;
    return noJS;
} 

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



function getSrc(node){
    return node.hasAttribute ? node.src : node.getAttribute("src", 4);
}

!function(){

    //保存页面中已存在的模块
    var script = document.getElementsByTagName("script"),
        length = script.length, i, src;
        
    for( i=0; i<length; i++ ){
        src = getSrc(script[i]);
        if( src ){
            Modules[src] = {id : src};
        }
    }

    //data-config设置配置选项
    var nojsScript = document.getElementById('nojs') || script[length-1],
        nojsSrc = getSrc(nojsScript),
        _config = nojsScript.getAttribute('data-config');
    
    //默认基址取noJS.js所在目录上一级
    Config.base = nojsSrc.split('/').slice(0,-2).join('/')+'/';

    //配置选项
    if( !_config ){
        return;
    }  
    if( /\.js$/.test(_config) ){
        
        use.defer = [];
        Loader.push([resolve(_config)], function(){

            //配置文件加载完毕
            if( use.defer ){
                var defer = [].concat(use.defer);
                use.defer = null;
                for( var i=0; i<defer.length; i++ ){
                    use.apply(null, defer[i]);
                }                
            }
        });

    }else{
        _config = eval('({' + _config + '})');
        noJS.config(_config);
    }
       
}();




})(this);
