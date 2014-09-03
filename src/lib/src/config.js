noJS.config = function(options){
    for( var i in options ){
        Config[i] = options[i];
    }

    //配置全局模块 只能执行一次
    if( Config.global && !noJS.config.global ){
        
        noJS.config.global = 1;
        use(Config.global, null, {front:true});
    }
    return noJS;
}
noJS.config.pending = null;

