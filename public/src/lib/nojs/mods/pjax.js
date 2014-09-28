/*
 * pjax
 * 2014-2-13
 * nolure@vip.qq.com
 */
define(function(require,$){
    /*
     * @options : {} 
     *  selector
     *  container
     *  timeout
     *  callback
     */
    
    //自增 标识每个pjax实例的id
    var index = 0;
    
    function pjax(options){
        this.options = options = $.extend(true, {}, pjax.config, options);
        //不支持pjax的浏览器直接退出
        if( !pjax.support ){
            return;
        }
        this.selector = typeof options.selector=='string' ? $(options.selector) : options.selector;
        this.container = options.container;
        if( !this.selector.length || !this.container || !this.container.length ){
            return;
        }
        this.init();
    }
    
    //检测浏览器是否支持pjax
    pjax.support =
        window.history && window.history.pushState && window.history.replaceState &&
        // pushState isn't reliable on iOS until 5.
        !navigator.userAgent.match(/((iPod|iPhone|iPad).+\bOS\s+[1-4]|WebApps\/.+CFNetwork)/)
    
    //初始配置
    pjax.config = {
        timeout : 3000,
        ajaxSettings : {
            type : 'get',
            dataTpye : 'json'
        }
    }
    
    pjax.item = {};//保存所有实例
    pjax.state = null;    
    pjax.cache = {};//缓存数据 
    
    window.onpopstate = function(event){
        var m;
        if( event && event.state && pjax.item[event.state.index] ){
            m = pjax.item[event.state.index];
            typeof m.options.start=='function' && m.options.start.call(m);
            m.onPopstate(event.state);
        }
    }
    
    pjax.prototype = {
        init : function(){
            var self = this;
            this.selector.on('click.pjax', function(e){
                self.handle(e);
            })
            this.index = ++index;
            pjax.item[index] = this;
        },
        handle : function(event){
            var target = event.target;
            
            if( target.tagName.toLowerCase() != 'a'){
                return;
            }
            if( event.which > 1 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey ){
                return;
            }
            //不能跨域
            if( location.protocol !== target.protocol || location.hostname !== target.hostname ){
                return;
            }
            //相同的链接
            if( target.href.split('#')[0] == location.href.split('#')[0] ){
                event.preventDefault();
                return;
            }
            //console.log(event.timeout,event.isDefaultPrevented());
            
            if( event.timeout ){
                return;
            }
            event.preventDefault();
            
            this.target = target;
            this.pjax(event);            
        },
        pjax : function(event){
            var top = this.container.offset().top,
                target = this.target;
            if( typeof this.options.scrollTop=='number' ){
                top = this.options.scrollTop;
            }
            if( target && target.hash ){
                var _target = $(target.hash);
                if( _target.length ){
                    $(window).scrollTop(_target.offset().top);
                }
            }
            $(window).scrollTop(top);
            
            typeof this.options.start=='function' && this.options.start.call(this);
            
            var url = target.href,
                _options = this.options;
            
            if( typeof _options.url=='function' ){
                url = _options.url.call(this, url);
            }
            //直接读取缓存
            if( pjax.cache[url] ){
                this.onPopstate(pjax.cache[url], true);
                return;
            }
            var self = this,
                options = $.extend(true, {}, $.ajaxSettings, _options.ajaxSettings),
                timer = _options.timeout, 
                xhr, timeoutTimer;
            
            if( pjax.support ){
                pjax.state = {
                    index : this.index,
                    title : document.title,
                    url : location.href,
                    //container : this.container.selector,
                    content : this.container.html()
                } 
                window.history.replaceState(pjax.state, document.title);
            }
               
            options.beforeSend = function(xhr, setting){
                xhr.setRequestHeader('X-PJAX', 'true');
                //xhr.setRequestHeader('X-PJAX-Container', context.selector)
                if( timer>0 ){
                    timeoutTimer = setTimeout(function(){
                        xhr.abort();
                        //var event = $.Event('click', { relatedTarget: target, timeout : true });
                        //console.log('timeout',event)
                        //self.selector.trigger(event);
                        location.href = target.href;
                    }, timer);
                }
            }
            options.complete = function(){
                if( timeoutTimer ){
                    timeoutTimer = clearTimeout(timeoutTimer);
                }
            }
            options.success = function(json){
                if( json.status==1 ){
                    
                    pjax.state.url = url;
                    
                    var content = json.data;
                    if( typeof _options.data=='function' ){
                        content = _options.data(json);
                    }
                    pjax.state.content = content;
                    
                    pjax.cache[url] = $.extend({}, pjax.state);
                    self.onPopstate(pjax.state, true);
                    
                }
            }
            options.error = function(){
                
            }
            
            options.url = url;
            xhr = $.ajax(options);
            
            if( xhr.readyState > 0 ){
                
            }
            
        },
        /*
         * 更新数据
         * replace : 是否更新地址栏
         */
        onPopstate : function(data, replace){
            if( pjax.support && replace ){
                window.history.pushState(data, '');
                window.history.replaceState(data, '', data.url);
            }
            document.title = data.title;
            this.container.html(data.content);
            typeof this.options.end=='function' && this.options.end.call(this);
            typeof this.options.callback=='function' && this.options.callback.call(this);
            
            
            //this.target = null;
        }
    }
    
    return pjax;
});
