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
        if( Modules.get(file) ){
            files.splice(i,1);
            length--;

            //end函数中会和complete比较
            complete--;
            end(null, 1, file, 1);

        }else{
            Modules.set(file, {id:file, bid:bid})
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
            typeof Modules.get(file).success=='function' && Modules.get(file).success();
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
        var mod = Modules.get(file);
        (repeat || !mod.cmd) && Branch.check(bid, 0);

        //该模块已完全就绪
        mod.state = 1;

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
