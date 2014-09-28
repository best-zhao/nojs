
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



