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


