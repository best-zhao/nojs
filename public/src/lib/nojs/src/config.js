//模块配置
noJS.config = function(options){    

    for( var i in options ){
        //同时将配置项挂在noJS.config上使外部可调用
        noJS.config[i] = Config[i] = options[i];
    }

    //全部转化为完整路径
    if( Config.update && Config.update.modules ){

        for( var i in Config.update.modules ){

            //这里要去掉自动添加的错误版本号 
            var mod = resolve(i, Config.base).split('?')[0], v = Config.update.modules[i];
            delete Config.update.modules[i];
            Config.update.modules[mod] = v;
        }

    }
    
    //载入全局模块 
    use(options.global, null, {front:true});

    return noJS;
}


