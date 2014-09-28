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
        currentMod = Modules.get(id),

        //主模块
        mainMod = Modules.get(Loader.point),
        length, 
        bid = mainMod.bid;
    
    if( !currentMod ){

        //合并的模块此时还未初始化 所以currentMod暂时不存在
        if( id && id!=Loader.point ){
            currentMod = Modules.get(id) = {
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