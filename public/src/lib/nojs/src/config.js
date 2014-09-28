//模块配置
noJS.config = function(options){    

    for( var i in options ){
        //同时将配置项挂在noJS.config上使外部可调用
        noJS.config[i] = Config[i] = options[i];
    }

    //将update中模块别名转化为标准模块
    if( Config.alias && Config.update && Config.update.modules ){
        for( var i in Config.update.modules ){
            if( Config.alias[i] ){
                Config.update.modules[Config.alias[i]] = Config.update.modules[i];
                delete Config.update.modules[i];
            }
        }
        console.log(Config.update.modules)
    }
    
    //配置全局模块 
    use(options.global, null, {front:true});

    return noJS;
}


