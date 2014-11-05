/**
 * 解析url搜索字符串及相关操作
 * 2014-10-15
 */
define(function(){

    function path(url){
        this.url = url || location.href;
        this.mainUrl = this.url.split('?')[0];
        this.path = this.url.split('?')[1] || '';
        this.hash = '';
        this.getHash();

        this.array = this.path ? this.path.split('&') : [];
        this.object = {};

        var i, m;
        for( i=0; i<this.array.length; i++ ){
            m = this.array[i].split('=');
            this.object[m[0]] = m[1];
        }
    }
    path.prototype = {
        getHash : function(){
            if( this.url.indexOf('#')<0 ){
                return;
            }
            var str = this.mainUrl.indexOf('#')>0 ? this.mainUrl : this.path;
            if( this.mainUrl.indexOf('#')>0 ){
                str = this.mainUrl.split('#');
                this.mainUrl = str[0];
            }else{
                str = this.path.split('#');
                this.path = str[0];
            }
            this.hash = str[1] ? '#'+str[1] : '';
        },
        init : function(update){
            update = update===false ? false : true;

            this.array = [];

            for( var i in this.object ){
                this.array.push(i+'='+this.object[i]);
            }
            this.path = this.array.join('&');

            this.url = this.mainUrl;
            if( this.path ){
                this.url += '?'+this.path;
            }
            this.url += this.hash;
            
            return this.url;
        },
        add : function(key, value){
            this.object[key] = value;
            return this.init();
        },
        remove : function(key){
            if( this.object[key] ){
                delete this.object[key];
            }            
            return this.init();
        }
    }


    return path;
})