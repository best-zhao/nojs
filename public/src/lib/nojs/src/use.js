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