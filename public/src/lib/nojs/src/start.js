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
