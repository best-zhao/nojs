/**
 * noJS 模块化管理js
 * 2013-3-6
 * nolure@vip.qq.com  
 */

(function( window, undefined ){
    var _noJS = window.noJS;
    if( _noJS && _noJS.version ){
        return;
    }
    
    var d = window.document,
        head = d.getElementsByTagName("head")[0],
        
        noJS = window.noJS = {
            version : '1.0'
        },
        //保存已载入的模块
        modules = {
            'start' : []//use入口回调
        },
        pathMap = {},//require中模块标识和完整路径的对应
        entrance = [],//入口id
        Update = {},//需要更新版本号的模块
        globalExports = [],//全局依赖接口
        //配置选项
        config = {
            queue : true,//默认为串行加载，false为并行加载
            fix : '.js'
        },
        //noJS本身加载完成之后的回调函数
        onReady,
        //标示全局模块加载完成，默认true表示不设置全局模块  2执行过config方法 1外部配置文件加载中
        globalReady,
        configFile = 0;
    
    //检测对象类型    
    function type( obj ){       
        return obj == null ? String( obj ) : Object.prototype.toString.call( obj ).slice( 8, -1 ).toLowerCase();
    }   
    
    /*
     * 从队列中取出一组模块载入到页面中
     */
    function load( file ){  
        var T = load,
            cf = T.now[2],
            num = 0,
            len = file.length,
            _len = len,
            _entrance = file.entrance,
            _now = [[].concat(file), T.now[1], T.now[2]],//保存当前队列的副本
            i, m;
            
        cf.queue = cf.queue===false ? false : config.queue;
        _now[0].entrance = _entrance;
        
        //console.log(file)
        //整理数组
        for( i=len-1; i>=0; i-- ){
            m = file[i];
            if( modules[m] ){//清除已存在模块
                file.splice(i,1);
                num--;//end函数中会和num比较
                len--;
                pushEntrance(T.now[1]?len:0, m);
                end( null, 1, m, 1 );
            }else{
                modules[m] = { id : m };
                if( _entrance ){
                    modules[m].entrance = _entrance;
                }
            }
            //cf.queue!==true && append(m);//并行加载
        }
        len = file.length;
        
        function pushEntrance(len, repeat){
            if( _entrance ){
                if( entrance[_entrance] ){
                    //console.log(len, _entrance, 'update',repeat,entrance[_entrance].branch) 
                    done(_entrance, len, 'pushEntrance');//减去重复模块 这里也需检测分支是否完成                   
                }else if( T.now[1] ){
                    //console.log(len,_entrance,'add',repeat,entrance[_entrance]&&entrance[_entrance].branch)
                    entrance[_entrance] = {branch:file.length, callback:T.now[1]};//记录该组分支数 回调 
                    T.now[1] = null; 
                }
            }
        }
        
        if(!len){
            return;
        }
        
        pushEntrance(1);//此处不改变分支 ，仅做检测   除新增分支外
        
        //打包时 指向真实的模块
        if( file.point ){
            for( i=0; i<file.point.length; i++ ){
                m = file.point[i];
                modules[m] = {id:m};
            }
        }
        
        num = 0;
        cf.queue===true && loader(0);
        
        function loader( index ){
            append( file[index] );
        }
        
        function append( src ){
            T.point = file.point ? file.point : src;
            //创建script
            var s = d.createElement("script");
            s.async = true;
            
            T.event( s, function(){
                end(this,1,src);
            }, function(){
                end(this,2,src);
            })
            s.src = src;
            head.appendChild(s);//插入文件到head中
        }
        /*
         * 单个文件载入完毕
         * @state:1成功，2失败
         */
        function end( s, state, src, repeat ){          
            num++;
            
            //文件加载完毕            
            if( _entrance && entrance[_entrance] && s && !repeat  ){
                if( !modules[src].cmd ){//存在非标准模块
                    done(_entrance, 0, 'end_nocmd');
                }
            }
            if( num>=len ){
                //当前队列回调
                var _state;
                if( _entrance && repeat ){
                    
                    //加载的模块全部为重复模块，获取这些模块的初次入口id,若有未完成的模块 则不进入下一队列
                    var i, eid;
                    for( i in modules ){
                        eid = modules[src].entrance;
                        //console.log(eid,i==src,entrance[eid])
                        if( i==src && eid && eid!=_entrance && entrance[eid] && entrance[eid].branch>0 ){
                            _state = eid;
                            entrance.splice(_entrance);
                            //把此组模板重新加入队列
                            T.add.apply(null, _now);
                            break;
                        }
                    }
                    if( !_state ){//此重复模块及所依赖全部完成 且  所有队列都加载完成                        
                        done(_entrance, 1, 'end');
                        //load.state = false;
                        //return;
                    }
                }
                //console.log(_entrance,repeat,_state,src,T.now[1]&&1)
                !_state && T.callback(T.now[1], src,'end');
                load.state = false;
                load.begin('end');
            }else if( cf.queue===true ){
                s && loader(num);
            }
        }
    }
    
    load.fileItem = [];     //存放文件数组队列
    load.now = null;        //当前队列
    load.point = null;      //当前指向的模块
    load.state = null;
    /*
     * 添加新文件及回调到队列组
     * @file:Array
     * @callback:文件加载完后回调
     * @opt:文件配置信息，包括路径和后缀等，不设置则使用默认配置
     * @order:添加顺序，默认是往队列后面追加 /  true表示添加到队列最前面，提前加载
     */
    load.add = function( file, callback, opt, order ){
        var T = load;
        if( type(file)=='array' && file.length ){
            opt = opt || {};
            T.fileItem[order==true?'unshift':'push']( [ file, callback, opt ] );
            T.begin('add');
        }
    }
    load.begin = function(p){
        if( !load.fileItem.length || configFile==2 && (load.fileItem[0] && !load.fileItem[0][2].isConf) || load.state  ){//配置文件正在载入，暂停队列   isConf标示为配置文件本身
            return;
        }
        //console.log(load.fileItem[0][0],p)
        load.state = true;
        load.now = load.fileItem.shift();
        load( load.now[0] );
    }
    /*
     * 模块路径解析
     * 1.标准路径：以设置的基址来查找模块
     * 2.相对路径： ./同级目录 ../上级目录   模块中相对当前模块(require和require.async) use中相对路径为普通路径,相对当前页面,同3
     * 3.普通路径：不做任何处理 直接加载该路径 以'http'或'/'开头
     */
    load.resolve = function(path, ptype, base){
        var _type = type(path);
        ptype = ptype || 0;//0 require入口    1 use入口
        
        if( _type == 'array' ){
            var rect = [], i;
            for( i=0; i<path.length; i++ ){
                rect.push( load.resolve(path[i], ptype, base) );
            }
            return rect;
        }
        if( _type != 'string' || !path.length ){
            return '';
        }
        if( pathMap[path] ){
            return pathMap[path];
        }
        var _path = path;
        base = base || load.point || config.base;
           
        if( /^(http|\/|file)/.test(path) ){//绝对路径
            return load.fix(path);//path+fix;
        }
        if( /^\.\//.test(path) ){// 以./开头 相对路径 同级目录
            path = path.replace(/^\.\//, '');
            //path = ptype==0 ? base.split('/').slice(0,-1).join('/')+'/'+path : path;
            if( ptype==1 ){//相对于当前页面
                return load.fix(path, _path);//path+fix
            }else{//2种情况 './../a/b' 或者 './a/b'   相对于当前模块
                return relativePath(path);
            }
        }
        
        if( !/^\.{2}\//.test(path) ){//标准路径
            return load.fix(config.base+path, _path);//config.base+path+fix
        }
        
        //相对路径 ../开头
        if( ptype==1 ){//相对当前页面
            return load.fix(path);//path+fix;
        }
        
        //require 以../开头的模块
        function relativePath(path){
            //相对require所在模块   需先获取当前模块路径
            var p1 = path.indexOf('../'),
                p2 = path.lastIndexOf('../'),
                s = base.indexOf('http') == 0 ? 3 : 1,
                level = p2/3+1;
            
            if( p1 < 0 ){//适用于'./a/b' > 'a/b' 
                return load.fix(base.split('/').slice(0,-1).join('/')+'/'+path, _path);
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
                return load.fix(s==3 ? base.join('/') : base[0]+'/'+path, _path);//base[0]+'/'+path+fix
            }
            return load.fix(base + path, _path);//base + path + fix
        }
        return relativePath(path);
    }
    /*
     * 添加后缀
     * @uri:解析过得uri
     * @path:原模块标识名， 默认等于uri
     */
    load.fix = function(uri, path){
        var fix = config.fix,
            version = '';
            
        path = path || uri;
        if( /\?|#/.test(path) ){
            path = path.replace(/#$/, '');//去掉末尾# 不需要添加后缀
            fix = '';
        }
        if( /\.js$/.test(path) ){
            fix = '';
        }
        if( Update=='all' || Update[path] ){
            version = (/\?/.test(uri)?'&':'?') + 't=' + config.update.version;
        }
        return uri + fix + version;
    }
    load.event = function( script, success, error ){
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
   
    load.callback = function(call,src,repeat){
        //call && console.log('callback',src,repeat)
        call && call( depsToExports(call.deps, null, 'load.callback') );  
    }
    
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
    
    /*
     * 模块定义
     * @factory:工厂函数 提供一个参数require来引入模块 并返回数据接口
     * 模块id使用其绝对路径
     */
    window.define = function(){
        var args = Array.prototype.slice.call(arguments),
            factory = args.slice(-1)[0],
            deps = args.length>2 && args[1],//使用工具自动提取依赖模板作为第二个参数
            //grunt提取依赖的时候有个bug 如a依赖b,b依赖c,c使用相对路径,提取后则在模块a的第二个参数中会将c变成非相对路径，所以c还是会被加载
            _type = type( factory ),
            pointType = type(load.point)=='array',
            current = pointType ? load.point.shift() : load.point,//当前载入模块的uri
            _modules, _modules_ = [], length, exports, _entrance, _entranceID, call;
        
        current = modules[current];
        if( !current ){
            return;
        }
        current.factory = factory;
        current.cmd = 1;//标示标准模块
        
        _entranceID = current.entrance;
        if( _entranceID ){
            _entrance = entrance[_entranceID];
        }
               
        if( _type=='function' ){
            //解析内部所有require并提前载入
            _modules_ = parseRequire( factory.toString() );
            length = _modules_.length;
            //此处有个bug 部分模块中存在压缩代码后正则无法提取依赖的情况 
            //if( deps && !length ){
                //_modules_ = deps;
                //length = _modules_.length;
            //}
            
            if( length ){
                _modules = load.resolve(_modules_, 0, current.id);
                var i, m, relative; 
                for( i=0; i<length; i++ ){
                    pathMap[_modules_[i]] = _modules[i];
                }
                current.deps = [].concat( _modules );
                
                function add(){
                    length = _modules.length;
                    if( _entrance ){//整个依赖链都要关联该id
                        _modules.entrance = _entranceID;
                    }
                    length && load.add(_modules,null,null,true);//提高依赖模块的优先加载顺序 order:true
                }
                function push(m,i){
                    if( modules[m] ){
                        _modules_.splice(i,1);
                        return;
                    }
                    modules[m] = {id : m};
                    if( _entrance ){
                        modules[m].entrance = _entranceID;
                    }
                }
                //设置打包后，当前模块所依赖模块会并入自身
                if( config.pack ){
                    
                    if( typeof load.point == 'string' ){
                        
                        load.point = []; 
                        //config.pack.relative只合并相对路径
                        //非相对路径 !/^\.{1,2}\// 过滤出来 加载模块
                        for( i=0; i<length; i++ ){
                            m = _modules[i];
                            relative = config.pack.relative && /^\.{1,2}\//.test(_modules_[i]);//相对路径
                            load.point.push(m);
                            if( modules[m] || relative ){
                                _modules_.splice(i,1);//模块标识Array
                                _modules.splice(i,1);//完整路径Array
                                i--;
                                length--;
                                push(m,i);
                                continue;
                            }
                            
                            if( config.pack.relative && !relative ){//非相对路径
                                load.point.pop(); 
                            }else{
                                push(m,i);
                            }
                        }
                        add();
                    }
                }else{
                    add();
                }
            }
        }else{
            current.exports = factory;
        }
        var branch;
        if( config.pack ){
            //pointType define开始执行时load.point的类型
            if( pointType ){//load.point=='array'
                branch = 0;
            }else{
                branch = (type(load.point)=='array' ? load.point.length : 0) + _modules_.length;
                //console.log(length, load.point, branch, _modules_)
            }
        }else{
            branch = _modules_.length;
        }
        //console.log(_entranceID && entrance[_entranceID].branch,_entranceID,branch,load.point)
        done(_entranceID, branch, 'define');
    }
    define.cmd = true;
    
    /*
     * 检测一条依赖链是否完成，更新其分支数 为0的时候即表示完成并执行回调
     * @eid：分支id
     * @step:变化的分支数
     */
    function done(eid, step, type){
        step = step || 0;
        //console.log(eid,entrance[eid] && entrance[eid].branch, step,type,load.point)
        var _entrance = entrance[eid];
        if( _entrance ){
            //console.log(_entrance.branch, step)
            _entrance.branch += step-1;
            if( _entrance.branch<=0 ){//该入口模块整个依赖链加载完毕                
                load.callback(_entrance.callback, load.point,'done');
                entrance[eid] = null;
            }
        }
    }
    done.use = function(type){
        //初始化 使用use执行代码块 队列回调  全局模块就绪后执行
        var call;
        while( modules['start'].length ){
            call = modules['start'].shift();
            call.deps = [].concat(init.gdeps);
            load.callback( call, 'done.use');
        }
    }
    
    //将所依赖模块转换成对应的接口
    function depsToExports( deps, global, type ){
        var _mod, j, rect = [];
        if( !deps ){
            return rect;
        }
        for( j=0; j<deps.length; j++ ){
            _mod = modules[deps[j]];
            
            if(!_mod){
                continue;
            }  
            getExports(_mod);
            global ? globalExports.push(_mod['exports']) : rect.push(_mod['exports']);
            
        }
        //console.log(deps,type)
        return rect;
    }
    
    //获取单模块的数据接口
    function getExports( mod ){
        if( mod.init ){
            return mod.exports;
        }
        mod.init = 1;
        mod.exports = mod.exports===undefined ? 
                ( type(mod.factory)=='function' ? getExports.run(mod) : mod.factory ) || {} : 
                mod.exports;
                
        return mod.exports;
    }
    //执行工厂函数
    getExports.run = function(mod, args){
        var args = [require].concat( globalExports );
        /*
         * 引入依赖模块
         * 同步模式：实际上该模块在外部模块的定义中已经被提前加载到页面中
         * 这里只是获取数据接口
         */
        function require( id ){
            var mod;
            id = load.resolve( id );
            mod = modules[id];
            return mod && getExports(mod);
        }
        require.async = function(){//按需加载模块
            var _mod = arguments[0],
                call = arguments[1],
                options = arguments[2] || {};
            options.async = mod.id;
            noJS.use(_mod ,call, options);
        }
        require.resolve = load.resolve;
        return mod.factory.apply( null, args );
    }
    
    //手动配置选项
    noJS.config = function( option ){
        option = option || {};
        if( !option.pack && configFile==1 ){//配置文件为外部调用，载入之前禁用配置全局，避免重复
            return noJS;
        }      
        
        var i;
        for( i in option ){
            config[i] = option[i];
        }
        configFile = null;
        
        //添加需要更新版本号的模块组
        var update = config.update || {};
        if( update.version ){
            if( type(update.files)=='array' ){
                update = update.files;
                for( i=0; i<update.length; i++ ){
                    Update[update[i]] = 1;
                }
            }else{
                Update = 'all';//更新全部
            }
        }  
        
        //设置全局依赖模块,会在其他模块之前引入，只能设置一次
        var global = config.global;
        
        if( globalReady != 2 ){
            if( !global ){
                globalReady = 2;
            }else if( !globalExports.length ){
                global = typeof global=='string' ? [global] : global;
                globalReady = null;
                
                if( type(global)=='array' ){
                    global = load.resolve(global);
                    init.gdeps = [].concat( global );
                    //打包后，全局依赖模块都并入第一个文件,并使用point指向真实的模块
                    if( config.pack ){
                        var _global = global;
                        global = config.pack.global || global.slice(-1);//默认全局模块最后一个作为合并后的模块
                        global.point = _global;
                    }
                    load.add( global, function(){                        
                        //保存全局依赖模块的接口
                        depsToExports( init.gdeps, true );
                        globalReady = 2;
                        done.use();
                    }, null, true);
                }
            }
        }          
        return noJS;
    }
    
    var defer = [];
    /*
     * 载入入口模块，或者执行一段依赖全局模块的代码块
     */
    noJS.use = function( path, fun, opt ){
        if( (configFile==1 || configFile==2) && defer ){
            defer.push(Array.prototype.slice.call(arguments));
            return noJS;
        }
        
        var T = load,
            t = type(path);
        
        if( !path ){return noJS;}
        
        function call( exports ){
            //console.log(path)
            //exports = opt && opt.async && exports ? exports.slice(globalExports.length,exports.length) : exports;
            fun && fun.apply( null, exports );
        }
           
        if( t=='function' ){
            //第一个参数为funtion时，在整个依赖链就绪之后直接执行代码块
            fun = path;
            call.deps = [].concat( init.gdeps );
            modules.start.push(call);
            globalReady==2 && done.use('noJS.use');
                    
        }else if( t=='array' || t=='string' ){//1/2个参数，添加模块,array
            t=='string' && ( path=[path] );//只添加一个模块 也可传入字符串
            
            if( type(fun)=='object' ){//无回调,参数2作为3使用
                opt = fun;
                fun = null;
            }
            opt = opt || {};
            //保存所依赖模块 
            //require.async 通过opt.async可获取当前所在模块的id
            var base = opt.async;
           
            path = load.resolve(path, base ? 0 : 1, base);
            //opt.async按需加载模块 只返回当前模块接口 
            opt.globalAfter = opt.globalAfter===false ? false : true;
            if( opt.globalAfter ){//全局接口放在后面
                call.deps = path.concat(base ? [] : init.gdeps);
            }else{
                call.deps = (base ? [] : init.gdeps).concat( path );
            }
            var eid = entrance.length+'';//toString
            path.entrance = eid;
            entrance[eid] = null;//占位
            //console.log(path,eid,call.deps)
            T.add(path, call, opt);
        }
        return noJS;
    }
    
    var script = d.getElementsByTagName("script"),
        Len = script.length,
        nojsScript = d.getElementById('nojs') || script[Len-1];
    
    function getSrc(node){
        return node.hasAttribute ? node.src : node.getAttribute("src", 4);
    }
        
    //data-config设置配置选项
    function init(){
        var i,
            T = load,
            nojsSrc = getSrc(nojsScript),
            _config = nojsScript.getAttribute('data-config');
        
        config.base = nojsSrc.split('/').slice(0,-2).join('/')+'/';
        //配置选项
        if( _config ){

            if( /\.js$/.test(_config) ){
                //console.log('config file begin');
                configFile = 1; //
                //该事件会在nojs脚本加载完成之后触发
                //打包之后config.js会并入noJS.js

                globalReady = 1;//加载外部配置文件必须执行一次noJS.config方法，在config方法里
                onReady = function(){
                    if( !config.pack ){
                        configFile = 2; //配置文件正在载入    
                        T.add( [load.resolve(_config+'#')], function(){
                            //配置文件加载完毕
                            if( defer ){
                                for( var i=0; i<defer.length; i++ ){
                                    noJS.use.apply(null, defer[i]);
                                }
                                defer = null;
                            }
                        }, {isConf:true} );
                    }
                    
                    onReady = null;
                }
                T.event( nojsScript, onReady);
            }else{
                _config = eval( '({' + _config + '})' );
                noJS.config( _config );
            }
        }        
    }
    
    init.gdeps = [];//保存全局依赖模块
    
    !function(){
        //保存已载入模块
        var i, src, baseUrl;
        for( i=0; i<Len; i++ ){
            src = getSrc( script[i] );
            if( src ){
                modules[ src ] = { id : src };
            }
        }
    }();
    init();
    
    //noJS本身也通过异步加载的方式
    if( _noJS && _noJS.args ){
        var methods = ["define", "config", "use"],
            args = _noJS.args;      
        for ( var i = 0; i < args.length; i += 2 ) {
            noJS[methods[args[i]]].apply( noJS, args[i + 1] );
        }
    }  
    
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
    
    /*
     * bug记录
     * 1.noJS.use(a);noJS.use(b);当模块a的依赖模块中存在b时，会出现错误(已解决,len--)
     * 2.载入外部配置文件的时候，use方法先缓存起来，文件载入完毕后再执行，防止use执行于配置之前
     * 3.ie9缓存配置文件导致出错
     * 4.解决相对路径模块的接口问题，原因是在获取完整路径时使用了全局配置，导致无法正确匹配模块。解决后将模块配置连同自身一起保存在modules对象中
     * 5.优化use方法：执行代码块不必等整个依赖链都加载完毕才执行，而是全局模块就绪即可
     * 6.由5导致的bug，载入入口模块a，a依赖b,当a完成而b正在载入时，后续use执行的代码块会直接触发done.use方法，导致前面入口模块a的回调一同执行，所以报错。
     *      优化后，回调会在该条入口模块链都完成后执行，添加全局变量entrance 从该入口开始的整个依赖链都会关联一个统一的入口id保存在entrance中
     * 7.修正6导致的bug，加载非标准模块的回调问题  没有减去重复模块分支数的问题   entrance占位应该在use方法中就执行
     * 8.修正打包后的bug，更新函数done，回调函数全部在define中执行（非标准模块除外）
     * 9.更改寻址操作load.getPath>load.resolve 路径转换全部改为load之前 去除use方法的单独配置功能 
     * 10.添加打包配置选项config.pack.relative：是否只打包相对路径的模块
     * 11.去除通过script标签的data-main属性加载入口模块的功能
     * 12.修正打包后多级依赖导致的bug, grunt合并后所有依赖都会体现在主模块上(如a>b>c>d，打包后模块a变成 -define\('a',['b','c','d'],factory) )
     * 13.bug:在一个模块中，同时依赖相对路径和标准路径的模块，如果只打包相对路径  就会匹配错误[已解决 传入done中的分支数有误]
     * 14.bug:连续2次执行require.async加载同样的模块 会导致该模块内的依赖模块无法加载(已解决)
     */
    
})( this );