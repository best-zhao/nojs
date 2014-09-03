/*
 * nojs UI
 * 2013-7-30
 * nolure@vip.qq.com
 */
!function(window, factory){
    if( typeof define=='function' && define.cmd ){
        define(factory);
    }else{
        window.ui = factory(null, jQuery);
    }
}(this, function( require ){
    
    var $ = require('$'), ui = {};
    
    //移动端
    ui.touch = function(callback){
        require.async('./touch', callback);
    } 
    if( screen.width <= 640 ){
        ui.mobile = true;
        ui.touch();
    }
    //console.log(screen.width);
    
    /*
     * 触发方式
     * 1.普通：直接执行相关方法，
     * 2.区域初始化：通过在Elements上配置相应的属性初始化对应区域内所有ui组件，默认body区域
     */
    ui.init = function( area ){
        area = area || $('body');
        
        var dom = area.find('[data-ui]'),
            i, elem, method, options;
            
        for( i=0; i<dom.length; i++ ){
            elem = dom[i];
            method = elem.getAttribute('data-ui');
            if( ui[method] ){
                if( (options = elem.getAttribute('data-config')) ){
                    options = eval('({'+options+'})') || {};
                    //elem.removeAttribute('data-config');
                }
                ui[method]( elem, options );
            }
        }    
    };
    
    var isNew, cache = {};
    function instaceofFun( fun, arg ){
        if( !(fun instanceof arg.callee) ){
            return newFun( arg.callee, Array.prototype.slice.call(arg) );
        }else{
            return false;
        }
    }
    ui.instaceofFun = instaceofFun;
    
    function newFun(parent, args) {
        function F(parent, args) {
            parent.apply(this, args);
        }
        F.prototype = parent.prototype;
        isNew = null;
        return new F( parent, args );
    }
    
    /*
     * 所有依赖dom的ui组件都可以通过id,element,jQuery来获取dom元素
     */
    function getDom( selector ){
        if( !selector ){return;} 
        var type = typeof selector, elem;
        if( type=='string' ){//通过id
            elem = $('#'+selector);
        }else if( type=='object' ){
            elem = selector.nodeType||selector===window||selector===window.parent ? $(selector) : selector;
        }
        elem = elem.length ? elem : null;        
        return elem;
    }
    ui.dom = getDom;
    
    //类继承
    function Extend(Child, Parent){
        var F = function(){};
        F.prototype = Parent.prototype;
        Child.prototype = new F();
        Child.prototype.constructor = Child;
        Child.baseConstructor = Parent;
        Child.baseClass = Parent.prototype;
    }
    //扩展子类原型方法
    Extend.proto = function(Class, value){
        for( var i in value ){
            (function(fn, _fn){
                Class.prototype[i] = function(){
                    fn.apply( this, [_fn].concat(Array.prototype.slice.call(arguments)) );
                };
            })(value[i], Class.prototype[i]);
        }
    }
    ui.extend = Extend;
    
    ui.data = function( id, Class ){
        if( Class ){//set
            cache[id] = Class;
        }else{
            return cache[id];
        }
    }
    
    //更改ui组件配置    
    ui.config = function(options){
        options = options || {};
        for( var i in options ){
            ui.config[i] = $.extend(true, ui.config[i], options[i]);
        }
    };  
    ui.config.eventType = ui.mobile ? 'tap' : 'mouseover';
    ui.config.clickEvent = ui.mobile ? 'tap' : 'click';
    
    /*
     * ES5扩展：JSON
     */  
    if( window.JSON == undefined ){
        
        window.JSON = function(){
            var rvalidchars = /^[\],:{}\s]*$/,
                rvalidbraces = /(?:^|:|,)(?:\s*\[)+/g,
                rvalidescape = /\\(?:["\\\/bfnrt]|u[\da-fA-F]{4})/g,
                rvalidtokens = /"[^"\\\r\n]*"|true|false|null|-?(?:\d+\.|)\d+(?:[eE][+-]?\d+|)/g;
                
            //JSON to string
            function stringify(data){
                if( $.type(data) != 'object' ){
                    return;
                }
                var i, m, value, rect = [];
                for( i in data ){
                    m = data[i];
                    if( m===undefined || typeof m=='function' ){
                        continue;
                    }
                    value = $.type(m)=='object' ? stringify(m) : String(m);
                    value = typeof m=='string' ? '"'+value+'"' : value;
                    rect.push('"'+i+'":' + value);
                }
                return '{'+rect.join(',')+'}';
            }
            
            //string to JSON
            function parse(data){
                if( typeof data != 'string' ){
                    return;
                }
                data = data.replace(/^\s*|\s*$/g,'');//strim
                
                if( data ){
                    if ( rvalidchars.test( data.replace( rvalidescape, "@" )
                        .replace( rvalidtokens, "]" )
                        .replace( rvalidbraces, "")) ) {
    
                        return ( new Function( "return " + data ) )();
                    }
                }                
            }
            
            return {
                stringify : stringify,
                parse : parse
            }
        }();
    } 
    /*
     * Array相关方法扩展
     */
    if( typeof Array.prototype.forEach != 'function' ) {
        Array.prototype.forEach = function (fn, context) {
            for (var k = 0, length = this.length; k < length; k++) {
                if (typeof fn === 'function' && Object.prototype.hasOwnProperty.call(this, k)) {
                    fn.call(context, this[k], k, this);
                }
            }
        }
    }
    if( typeof Array.prototype.map != 'function' ) {
        Array.prototype.map = function (fn, context) {
            var arr = [];
            if( typeof fn === 'function' ){
                for( var k = 0, length = this.length; k < length; k++ ){      
                    arr.push(fn.call(context, this[k], k, this));
                }
            }
            return arr;
        }
    }
    if (typeof Array.prototype.filter != 'function' ) {
        Array.prototype.filter = function (fn, context) {
            var arr = [];
            if( typeof fn === 'function' ){
               for( var k = 0, length = this.length; k < length; k++ ){
                  fn.call(context, this[k], k, this) && arr.push(this[k]);
               }
            }
            return arr;
        }
    }
    if( typeof Array.prototype.indexOf != 'function' ) {
        Array.prototype.indexOf = function(value){
            var index = -1;
            this.forEach(function(val, i){
                if( val === value ){
                    index = i;
                }
            })
            return index;
        }
    }
    
    /* 
     * [animate动画扩展]
     * http://gsgd.co.uk/sandbox/jquery/easing/jquery.easing.1.3.js
     * easeIn：加速度缓动；
     * easeOut：减速度缓动；
     * easeInOut：先加速度至50%，再减速度完成动画
     */    
    $.extend( $.easing, {
        //指数曲线缓动
        easeOutExpo: function (x, t, b, c, d) {
            return (t==d) ? b+c : c * (-Math.pow(2, -10 * t/d) + 1) + b;
        }
    });
    $.extend($, {
        //取消事件的默认动作 e.preventDefault()   stopDefault
        //阻止冒泡 e.stopPropagation()        stopBubble
        onScroll : function( object, onScroll ){
            //自定义鼠标滚轮事件
            var scrollFunc = function(e){ 
                e = e || window.event;  
                if( e.wheelDelta ){//IE/Opera/Chrome 
                    e.returnValue = false;//阻止网页滚动条滚动
                }else if(e.detail){//Firefox 
                    e.preventDefault(); 
                }
                //e.preventDefault();
                onScroll && onScroll(e);
            } 
            if(document.addEventListener){//firefox
                object.addEventListener( "DOMMouseScroll", scrollFunc, false );
            }
            object.onmousewheel = scrollFunc;//IE/Opera/Chrome/Safari 
        },
        browser : function(){
            //检测浏览器
            var u = navigator.userAgent.toLowerCase(),
            v = u.match(/(?:firefox|opera|safari|chrome|msie)[\/: ]([\d.]+)/),
            //mozilla/5.0 (windows nt 6.1; wow64; trident/7.0; slcc2; .net clr 2.0.50727; .net clr 3.5.30729; .net clr 3.0.30729; media center pc 6.0; .net4.0c; .net4.0e; rv:11.0) like gecko
            //ie11已去除msie标示 可通过trident检测
            fn = {
                version:v?v[0]:' ',//浏览器版本号
                safari:/version.+safari/.test(u),
                chrome:/chrome/.test(u),
                firefox:/firefox/.test(u),
                ie:/msie/.test(u),
                ie6:/msie 6.0/.test(u),
                ie7:/msie 7.0/.test(u),
                ie8:/msie 8.0/.test(u),
                ie9:/msie 9.0/.test(u),
                opera: /opera/.test(u) 
            }, state;
            function check( name ){
                //多个用逗号隔开 如'ie6 ie7'
                state = false;
                name = name.split(' ');
                $.each( name, function( i, val ){
                    if( fn[ val ] ){
                        state = true;
                        return false;
                    }
                })
                return state;
            }
            //check.fn = fn;
            check.version = parseInt(fn.version.split(/[\/: ]/)[1].split('.')[0]);
            return check; 
        }(),
        tmpl : function(){
            /*
             * js模版引擎
             * http://ejohn.org/blog/javascript-micro-templating/
             */
            var c = {};
            return function(s,d){
                var fn = !/\W/.test(s) ? c[s]=c[s]||$.tmpl(document.getElementById(s).innerHTML):
                new Function("o",
                "var p=[];"+"with(o){p.push('"+
                s
                //.replace(/\\/g,"\\\\")//解决转义符bug
                .replace(/[\r\t\n]/g," ")            
                .split("<%").join("\t")
                .replace(/((^|%>)[^\t]*)'/g,"$1\r")
                
                //.replace(/\t=(.*?)%>/g, "',$1,'")
                //将undefined的值置为''
                .replace(/\t=(.*?)%>/g, "',(typeof $1=='undefined'?'':$1),'")
                
                .split("\t").join("');")
                .split("%>").join("p.push('")
                .split("\r").join("\\'")
                + "');}return p.join('');");
                return d?fn(d):fn;
            };
        }(),
        cookie : function( name, value, options ){
            /*
             * 读取cookie值: $.cookie("key"); 
             * 设置/新建cookie的值:    $.cookie("key", "value");
             * 新建一个cookie 包括有效期(天数) 路径 域名等:$.cookie("key", "value", {expires: 7, path: '/', domain: 'a.com', secure: true});
             * 删除一个cookie:$.cookie("key", null);    
             */        
            if (typeof value != 'undefined') {
                options = options || {};
                if (value === null) {
                    value = '';
                    options.expires = -1;
                }
                var expires = '';
                if (options.expires && (typeof options.expires == 'number' || options.expires.toUTCString)) {
                    var date;
                    if (typeof options.expires == 'number') {
                        date = new Date();
                        date.setTime(date.getTime() + (options.expires * 24 * 60 * 60 * 1000));
                    } else {
                        date = options.expires;
                    }
                    expires = '; expires=' + date.toUTCString();
                }
                var path = options.path ? '; path=' + (options.path) : '';
                var domain = options.domain ? '; domain=' + (options.domain) : '';
                var secure = options.secure ? '; secure' : '';
                document.cookie = [name, '=', encodeURIComponent(value), expires, path, domain, secure].join('');
            } else { 
                var cookieValue = '';
                if (document.cookie && document.cookie != '') {
                    var cookies = document.cookie.split(';');
                    for (var i = 0; i < cookies.length; i++) {
                        var cookie = $.trim(cookies[i]);
                        if (cookie.substring(0, name.length + 1) == (name + '=')) {
                            cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                            break;
                        }
                    }
                }
                return cookieValue;
            }
        },
        addCss : function(css){
            //动态创建css @css:string
            if( typeof css!='string' ){
                return;
            }
            var i, style;
             
            if( document.createStyleSheet ) {
                window.style= css; 
                document.createStyleSheet("javascript:style"); 
            }else{
                style = document.createElement('style'); 
                style.type = 'text/css'
                style.innerHTML = css; 
                document.getElementsByTagName('HEAD')[0].appendChild(style);
            }
        },
        localStorage : function(){
            var localStorage = window.localStorage || (function(){
                //userData
                var o = document.getElementsByTagName("head")[0],
                    n = window.location.hostname || "localStorage",
                    d = new Date(),
                    doc, agent;
                    
                if( !o.addBehavior ){
                    return {};
                }
                try{ 
                    agent = new ActiveXObject('htmlfile');
                    agent.open();
                    agent.write('<s' + 'cript>document.w=window;</s' + 'cript><iframe src="/favicon.ico"></frame>');
                    agent.close();
                    doc = agent.w.frames[0].document;
                }catch(e){
                    doc = document;
                }
                o = doc.createElement('head');
                doc.appendChild(o);
                d.setDate(d.getDate() + 365);
                o.addBehavior("#default#userData");
                o.expires = d.toUTCString();
                o.load(n);
                
                var root = o.XMLDocument.documentElement,
                attrs = root.attributes,
                prefix = "prefix_____hack__",
                reg1 = /^[-\d]/,
                reg2 = new RegExp("^"+prefix),
                encode = function(key){
                    return reg1.test(key) ? prefix + key : key;
                },
                decode = function(key){
                    return key.replace(reg2,"");
                };
                
                return {
                    length: attrs.length,
                    getItem: function(key){
                        return (attrs.getNamedItem( encode(key) ) || {nodeValue: null}).nodeValue || root.getAttribute(encode(key)); 
                    },
                    setItem: function(key, value){
                        root.setAttribute( encode(key), value); 
                        o.save(n);
                        this.length = attrs.length;
                    },
                    removeItem: function(key){
                        root.removeAttribute( encode(key) ); 
                        o.save(n);
                        this.length = attrs.length;
                    },
                    clear: function(){
                        while(attrs.length){
                            this.removeItem( attrs[0].nodeName );
                        }
                        this.length = 0;
                    },
                    key: function(i){
                        return attrs[i] ? decode(attrs[i].nodeName) : undefined;
                    }
                };
            })();
            var exports = {
                length : localStorage.length,
                set : function(key, value, options){
                    options = options || {};
                    
                    //iPhone/iPad 'QUOTA_EXCEEDED_ERR'
                    if( this.get(key, false) !== undefined ){
                        this.remove(key);
                    }
                    
                    //options.expires过期时间 单位天  使用一个独立的key来保存所有设置过期时间的键
                    if( typeof options.expires == 'number' ){
                        expiresData[key] = (+new Date) + options.expires*24*60*60*1000;
                        exports.set(expiresKey, JSON.stringify(expiresData));
                    }
                    
                    localStorage.setItem(key, value, options);
                    this.length = localStorage.length;
                },
                get : function(key, isCheck){
                    //get时检测是否过期
                    isCheck = isCheck===false ? false : true;//防止重复查询
                    isCheck && expiresCheck();
                    var v = localStorage.getItem(key);
                    return v === null ? undefined : v;
                },
                remove : function(key){ 
                    localStorage.removeItem(key); 
                    this.length = localStorage.length;
                },
                clear : function(){
                    localStorage.clear();
                    this.length = 0;
                },
                key : function(index){//获取索引为index的key名称
                    return localStorage.key(index);
                }
            },
            expiresKey = '__expireskey__',
            expiresData = exports.get(expiresKey, false);
            
            //检测是否过期
            function expiresCheck(){
                var key, i=0;
                for( key in expiresData ){
                    if( (+new Date) > expiresData[key] ){
                        exports.remove(key);
                        delete expiresData[key];
                        continue;
                    }
                    i++;
                }
                if( i>0 ){
                    exports.set(expiresKey, JSON.stringify(expiresData))
                }else{//全部过期 删除此key
                    exports.remove(expiresKey);
                }
            }
            if( expiresData ){
                expiresData = JSON.parse(expiresData);
                expiresCheck();
            }else{
                expiresData = {};
            }
            exports.check = expiresCheck;
            
            return exports;
        }()
    });
    
    /*
     * ajax事件集合类
     * @on : 绑定事件
     * @trigger : 触发事件
     * 参数相同[action, options]
     */
    ui.events = function(){
        var Events = {},
        config = {//全局选项
            //newData : 只使用外部数据，将配置数据置空(副本)
            _data : {},//传递附加数据
            type : 'post',
            dataType : 'json'
        };
        
        function parseConf(conf){
            for( var i in conf ){
                if( i=='reverse' || conf.reverse[i] ){
                    continue;
                }
                conf.reverse[i] = conf[i];
            }
        }
        
        return {
            //配置默认选项
            config : function(options){
                config = $.extend(true, config, options);
            },
            //添加事件
            add : function(events){
                var i, m;
                for( i in events ){
                    m = $.extend(true, {}, config, events[i]);
                    m.reverse && parseConf(m);
                    Events[i] = m;
                }
            },
            //绑定事件
            on : function(action, options){
                if( $.type(action)=='object' ){//批量添加
                    for( var i in action ){
                        ui.events.on(i, action[i]);
                    }
                    return;
                }
                
                options = options || {};        
                var target = ui.dom(options.target);
                if( typeof action!='string' || !target ){
                    return;
                }                
                target.on(ui.config.clickEvent, function(){
                    //dom上使用data-state属性标示初始状态，如已关注标示为1,否则为0或不标示
                    ui.events.trigger( action, $.extend( {}, options, {target:this, state:$(this).data('state')} ));
                    return this.tagName.toLowerCase()=='input' ? true : false;
                })
            },
            //触发事件
            trigger : function(action, options){
                if( typeof action!='string' ){
                    //无动作名则为临时动作，只有一个参数options
                    options = action;
                }
                if( $.type(options) != 'object' ){
                    return;
                }
                var _config = Events[action] || config,
                    conf, data, reverse, target;
                
                options = options || {};
                target = options.target;
                
                if( target && $(target).data('ajaxState') ){
                    return;
                }  
                if( reverse = _config.reverse ){//是否执行反向动作
                    reverse = $(target).data('state') ? true : false;//初始状态
                    if( options.reverse ){
                        parseConf(options);
                        options = reverse ? options.reverse : options;
                    }
                }
                conf = $.extend(true, {}, reverse ? _config.reverse : _config);//创建全局配置的副本
                
                if( typeof options.data=='function' ){//外部数据
                    options.data = options.data.call(target);
                }
                if( options.newData ){//只使用外部数据，不使用配置数据
                    conf.data = null;
                }else if( typeof conf.data=='function' ){//配置数据
                    conf.data = conf.data.call(target);
                }
                conf = $.extend(true, conf, options);//合并得到最终选项                
                
                
                var beforeSend = conf.beforeSend, bf;
                
                if( beforeSend ){
                    bf = beforeSend.call(conf)
                    if( bf===false ){
                        return;
                    }
                    delete conf.beforeSend;//防止重复执行
                }
                
                target = $(target);
                target.data('ajaxState', true);
                
                var success = conf.success || [];
                conf.success  = $.type(success)=='array' ? success : [success];
                
                conf.success.unshift(function(json){
                    //json = status=='success' ? eval('('+json.responseText+')') : {};
                    target.data('ajaxState', null);
                    if( json.status == 1 && _config.reverse ){//还原反向动作状态
                        conf.state = _config.state = reverse ? null : 1;
                        target.data('state', conf.state);
                    }
                });
                conf.context = conf;
                $.ajax(conf);
            }
        }
    }();
    
    /*
     * 将对象对齐到某个参考元素nearby
     * nearby是window对象,即固定在屏幕上
     * relative为true可设置为类似css的背景图定位方式,只限百分比
     */    
    ui.align = function(options){
        this.options = options = options || {};
        this.element = getDom(options.element);
        this.nearby = getDom(options.nearby);
        var screen = this.nearby && this.nearby[0]===window;
        //this.position = options.position || (screen ? {top:50, left:50} : {top:100, left:0});
        this.position = $.extend((screen ? {top:50, left:50} : {top:100, left:0}), options.position);
        this.relative = options.relative!=undefined ? options.relative : screen ? true : false;
        
        this.fixed = options.fixed==undefined && screen ? 'fixed' : options.fixed;//null fixed animate
        this.cssFixed = this.fixed=='fixed' && !$.browser('ie6') && screen;//直接使用css:fixed来定位
        
        this.offset = options.offset || [0,0];
        this.isWrap = this.nearby && (screen || this.nearby.find(this.element).length);//对象是否在参考对象内部
        this.autoAdjust = options.autoAdjust;//超出屏幕后是否自动调整位置
        
        this.element && this.bind();
    }
    ui.align.prototype = {
        bind : function(){
            var self = this,
                ns = this.element.data('align'),
                type;
                
            if( ns ){
                this.nearby.add(window).off( ns );
            }else{
                ns = '.align'+(new Date()).getTime();
                this.element.data('align', ns);
            }
            
            if( !this.cssFixed && this.fixed ){
                this.nearby.on('scroll'+ns, function(){
                    self.set();
                });
            }
            $(window).on('resize'+ns, function(){
                self.set();
            })
            
            this.set();
        },
        get : function(nearby){
            nearby = nearby || this.nearby;
            var offset = nearby.offset(),
            size = {
                width : nearby.outerWidth(),
                height : nearby.outerHeight(),
                x : offset ? offset.left : 0,
                y : offset ? offset.top : 0,
                scrollLeft : this.cssFixed ? 0 : nearby.scrollLeft(),
                scrollTop : this.cssFixed ? 0 : nearby.scrollTop(),
                WIDTH : this.element.outerWidth(true),
                HEIGHT : this.element.outerHeight(true)
            };
            return size;
        },
        set : function(options){
            //可设置nearby position offset relative等参数覆盖初始选项
            if( !this.element || this.visible==false ){
                return;
            }
            
            options = options || {};
            
            var position = options.position || this.position,
                nearby = getDom(options.nearby) || this.nearby;
            
            if( !nearby ){
                return;
            }
            this.element.css('position', this.cssFixed ? 'fixed' : 'absolute');//设置在get方法之前
            
            var size = this.get(nearby),
                Attr = {
                    x : {}, y : {}
                }, 
                _Attr, attr, value, _value, type, direction, style = {}, wrapSize;
            
            if( this.isWrap ){
                size.x = size.y = 0;
            }    
            Attr.x.element = 'WIDTH';
            Attr.y.element = 'HEIGHT';
            Attr.x.nearby = 'width';
            Attr.y.nearby = 'height';
            Attr.x.offset = 0;
            Attr.y.offset = 1;
            Attr.x.scroll = 'scrollLeft';
            Attr.y.scroll = 'scrollTop';
            
            for( attr in position ){
                value = _value = position[attr];
                type = typeof value;
                if( type=='function' ){
                    value = value(size);
                    type = typeof value;
                }
                direction = attr=='top' || attr=='bottom' ? 'y' : 'x';
                _Attr = Attr[direction];
                
                value = type=='number' ? 
                    (size[_Attr.nearby] - (this.relative?size[_Attr.element]:0)) * value/100 :
                    parseInt(value,10);
                    
                if( attr=='bottom' || attr=='right' ){
                    value *= -1;
                    value -= size[_Attr.element] - size[_Attr.nearby];
                }
                
                value += size[direction] + this.offset[_Attr.offset] + size[_Attr.scroll];
                
                if( this.autoAdjust ){
                    //屏幕边界限制
                    wrapSize = this.isWrap ? size[_Attr.nearby] : $(window)[_Attr.nearby]();
                    if( value + size[_Attr.element] - size[_Attr.scroll] > wrapSize ){
                        if( size[_Attr.element] < size[direction] - size[_Attr.scroll] ){
                            value = size[direction] - size[_Attr.element];
                        }else{
                            value = size[_Attr.scroll];
                        }
                    }else if( value<size[_Attr.scroll] ){
                        value = size[_Attr.scroll];
                    }
                }
                
                style[direction=='x'?'left':'top'] = value;
            }
            
            if( this.fixed=='animate' ){
                this.element.stop().animate( style, 200 );
                return;
            }
            this.element.css(style);
        }
    }
    
    /*
     * 元素显示隐藏效果集合
     */
    ui.effect = function(element, effect){
        if( !element || !element.length ){
            return;
        }
        this.element = element;
        
        this.effect = effect || 'normal';
    }
    ui.effect.prototype = {
        item : {
            'normal' : [function(e){
                e.removeClass('v_hide nj_hide');
            }, function(e){
                e.addClass('v_hide nj_hide');
            }],            
            'fade' : [function(e){
                e.css({
                    'visibility' : 'visible',
                    'opacity' : 0
                }).stop().fadeTo(300, 1);
            }, function(e){
                e.fadeTo(400, 0, function(){
                    e.css('visibility', 'hidden');
                });
            }],
            'slide' : [function(e){
                e.css({
                    'visibility' : 'visible',
                    'display' : 'none'
                }).stop().slideDown(200);
            }, function(e){
                e.slideUp(200, function(){
                    e.css('visibility', 'hidden');
                });
            }]
        },
        show : function(){
            this.item[this.effect][0](this.element);
        },
        hide : function(){
            this.item[this.effect][1](this.element);
        }
    }
    /*
     * 浮动层
     */
    ui.overlay = function(options){
        options = $.extend(true, {}, ui.config.overlay, options);
        //className主要用于全局配置 name则用于单个实例配置
        options.className = [options.className || '', options.name || ''].join(' '); 
        
        var insertTo = (options.parent ? window.parent : window).document;
        options.insertTo = options.insertTo=='body' ? insertTo.body : $(insertTo).find(options.insertTo);
        
        ui.overlay.baseConstructor.call(this, options);
        //this.insertTo
        this.visible = false;//可视状态
        this.content = null;//内容区域
        this.arrow = this.options.arrow;//箭头 根据align对齐方式自动调整指向
        this.timeout = this.options.timeout;
        this.onShow = this.options.onShow;
        this.onHide = this.options.onHide;
        ui.overlay.item.push(this);
        this.init();
    };
    ui.config.overlay = {
        showClassName : 'nj_overlay_show',
        insertTo : 'body'
    }
    Extend(ui.overlay, ui.align);
    Extend.proto(ui.overlay, {
        set : function(fn, key, value){
            if( key=='content' ){
                this.content.empty().append(value);
            }else{
                fn.call(this, value);
            }
        }
    });
    ui.overlay.item = [];
    ui.overlay.hide = function(){
        var item = ui.overlay.item,
            n = item.length,
            i = 0;
        for( ; i<n; i++ ){
            item[i].hide();
        }
    };
    ui.overlay.prototype.init = function(){
        var self = this;          
        
        this.element = $('<div class="v_hide d_show nj_overlay '+this.options.className+'"><div class="nj_overlay_wrap"></div></div>').appendTo(this.options.insertTo);
        this.content = this.element.find('.nj_overlay_wrap');
        
        if( this.arrow ){
            this.arrow.element = $('<div class="nj_overlay_arrow"></div>').appendTo(this.element);
            this.arrow.offset = this.arrow.offset || [0,0];
        }
        this._effect = new ui.effect(this.element, this.options.effect);
        this.bind();
    }; 
    ui.overlay.prototype.show = function(callback){
        
        if( this.visible ){
            return;
        }
        var self = this;
        
        this.element.addClass(this.options.showClassName);
        
        if( this.timeout ){
            this.autoHide = setTimeout(function(){
                self.hide();
            }, this.timeout)
        }
        this._effect.show();
        this.visible = true;
        this.set();
        callback && callback.call(this);
        this.onShow && this.onShow.call(this);
        
        return;
        if( self.arrow ){
            var top = 0, left = 0,
                direction = self.arrow.direction || pos[2];
            
            if( direction=='up' || direction=='down' ){
                //top = direction=='up' ? self.arrow.element.outerHeight()*-1 : self.element.innerHeight();
            }else if( direction=='left' || direction=='right' ){
                //left = direction=='left' ? self.arrow.element.outerWidth()*-1 : self.element.innerWidth();
            }
            
            self.arrow.element.css({
                top : top,
                left : left
            }).attr('class', 'nj_overlay_arrow nj_overlay_arrow_'+direction);
        }
    };
    ui.overlay.prototype.hide = function(callback){
        if( !this.visible ){
            return;
        }
        this._effect.hide();
        this.element.removeClass(this.options.showClassName);
        this.autoHide = clearTimeout(this.autoHide);
        this.visible = false;
        callback && callback.call(this);
        this.onHide && this.onHide.call(this);
    };
    ui.overlay.prototype.on = function(options){
        options = options || {};
        
        var self = this,
            mode = options.mode || ui.config.eventType,
            agent = $.type(options.element)=='array' && options.element.length>1,
            hasNearby = !!this.nearby,
            element = getDom(agent ? options.element[0] : options.element) || this.nearby,
            hoverClass = this.options.hoverClass || 'nj_overlay_show',
            isHover, show, hide, showTime, hideTime, hideEvent;
        
        if( !element ){
            return;
        };
        
        isHover = mode == 'mouseover';
        hideEvent = isHover ? ' mouseout' : '';    
        
        show = function(e){
            var t, tag, type, el;
            
            if( agent ){
                t = e.target;
                tag = t.tagName.toLowerCase();
                el = options.element[1];
                type = typeof el;
                
                if( type =='function' ){
                    el = el.call(t, tag);//返回布尔值 或 对象
                    
                }else if( type == 'string' ){
                    el = $(t).closest(el);
                    
                    if( !el.length ){
                        return;
                    }
                }else{
                    el = null;
                };
                if( !el ){
                    return;
                };
                var now = $(typeof el=='boolean' ? t : el);// 返回的el是对象时 该对象作为self.nearby对象
                self.visible && self.set('align', {
                    nearby : now
                });
                self.visible && self.nearby.removeClass(hoverClass);
                self.nearby = now;
            }else if( !hasNearby ){
                element.length>1 && self.hide();
                //self.options.pop && console.log(this)
                self.nearby = $(this);
            };
            
            el = $(this);
            
            if( isHover ){
                hideTime = clearTimeout(hideTime);
                showTime = setTimeout(function(){
                    if( !agent && !hasNearby ){
                        self.nearby = el;
                    }
                    show.e();
                }, 50);
            }else{
                !hideEvent && self.visible ? self.hide() : show.e();
            }
            e.preventDefault();
            
            //当元素上同时也绑定了其他事件时，可以设置options.stopBubble==false
            if( !isHover && options.stopBubble!==false ){
                e.stopPropagation();
            }
        };
        show.e = function(){
            self.show();
            self.nearby.addClass(hoverClass);
            options.callback && options.callback.call(self);//
        }
        hide = function(e){   
            e.stopPropagation();
            hideEvent ? !function(){
                showTime = clearTimeout(showTime);
                hideTime = setTimeout(function(){
                    self.hide();
                }, 10)
            }() : self.hide();
        };
        
        var _onHide = this.onHide;
        this.onHide = function(){
            _onHide && _onHide.call(this);
            self.nearby && self.nearby.removeClass(hoverClass);
            if( !hasNearby ){//防止2次使用on方法 第一次会影响第二次的 所以还原到初始化之前的状态
                //self.nearby = null;
            }
        }
        
        element.on(mode, show);
        
        hideEvent && element.on(hideEvent, hide);
        
        !isHover && !function(){
            $(document).on(mode, hide);
            self.element.on(mode, function(e){
                e.stopPropagation();
            })
        }();
        
        isHover && this.element.hover(function(){
            hideTime = clearTimeout(hideTime);
        }, hide);
    }
    ui.overlay.prototype.destroy = function(){
        this.element.remove();
    }
       
    ui.layer = function(){
        /*
         * 遮罩层
         */
        var w = $(window),
            layer = $("#nj_layer"),
            arr = { show : show, hide : hide },
            effect;
        function init(){
            layer = $('<div id="nj_layer" class="nj_layer"></div>').appendTo(document.body);
            
            if( $.browser('ie6') ){
                S = function(){
                    layer.css({
                        width : w.width(),
                        height : w.height()
                    });
                };
                S();
                w.on('scroll resize', S);
                
                new ui.align({
                    element : layer
                });
            }
            $.onScroll( layer[0] );
            arr.element = layer;
            effect = new ui.effect(layer);
        };
        function show(){
            !document.getElementById('nj_layer') && init();
            layer.addClass('nj_layer_show');
            effect.show();
        };
        function hide(){
            if( !layer || !effect ){
                return;
            } 
            layer.removeClass('nj_layer_show');
            effect.hide();
        };
        
        return arr;
    }();
    
    ui.popup = function( options ){
        options = $.extend(true, {}, ui.config.popup, options);
        
        options.name = ['nj_win', options.name || ''].join(' '); 
        options.nearby = options.nearby || (options.parent?window.parent:window);
        
        ui.popup.baseConstructor.call(this, options);
        
        this.theme = options.themeItem[options.theme];
        this.close = null;
        this.title = null;
        this.operating = null;
        this.layer = options.layer==false ? false : true;
        this.bindEsc = options.bindEsc == false ? false:true;
        this.onShow = options.onShow;
        this.onHide = options.onHide;
        this.create();
    }
    ui.config.popup = {
        themeItem : {
            'default' : {
                button : {base:'nj_btn', submit:'n_b_sb'}
            }
        },
        theme : 'default',
        className : 'drop_pop',
        showClassName : 'drop_pop_show'
    }
    Extend(ui.popup, ui.overlay);
    Extend.proto(ui.popup, {        
        set : function(fn, key, value){
            /*
                                   设置标题、内容、按钮
            */
            if( key=='title' ){
                value && this.title.html(value).show();
            }else if( key=='button' ){
                this.button = [];
                this.operating.empty()[value?'show':'hide']();//重设操作区
                if( value ){                    
                    for( var i=0; i<value.length; i++ ){
                        this.addBtn.apply( this, value[i] );
                    }
                }
            }else{
                fn.call(this, key, value);
            }
        },
        show : function(fn, callback){
            /*
                                            显示弹窗
                @callBack:可选参数，回调函数
            */
            if( this.visible ){
                return;
            }
            this.layer && ui.layer.show();
            fn.call(this, callback);
            
            //this.bindEsc && ui.popup.focus.push(this);
            if( this.bindEsc && !ui.popup.focus[this.key] ){
                ui.popup.focus[this.key] = this;
            }
        },
        hide : function(fn, callback){
            /*
                                            隐藏弹窗
                @callBack:可选参数，回调函数
            */
            if( !this.visible ){
                return;
            }
            var self = this, 
                hideLayer = this.layer;
            /*
             * onbeforehide:关闭之前确认
             */
            if( this.onbeforehide && !this.onbeforehide() ){
                return;
            }
            fn.call(self, callback);
            
            this.layer && $.each(ui.popup.item, function(){//检测其他弹窗看是否需要保留遮罩
                if( this.key != self.key && this.visible && this.layer ){
                    hideLayer = false;
                    return false;
                }
            })
            hideLayer && ui.layer.hide();
            delete ui.popup.focus[this.key];
        }
    })
    ui.popup.prototype.create = function(){
        var self = this,
            id = 'nj_popup_' + (+new Date);
        
        ui.popup.item[id] = this;
        this.key = id;
        
        this.set('content', [
            '<span class="win_close"></span><div class="win_tit"></div>',
            '<div class="win_con clearfix"></div>',
            '<div class="win_opt"></div>'
        ].join(''));
        this.content.addClass('win_wrap');
        
        if( this.options.fullScreen ){//全屏
            this.element.css( {'width':'100%','height':'100%'} );
            this.position = {top:0,left:0}
            this.element.addClass('full_pop');
            this.layer = null;
        }else{
            this.element.css( {'width':this.options.width} );
        }
        
        this.element[0].id = id;
        this.close = this.element.find(".win_close");
        this.title = this.element.find(".win_tit").hide();
        this.content = this.element.find(".win_con");
        this.operating = this.element.find(".win_opt").hide();
        
        new ui.ico( this.close, {type:'close'} );
        
        this.close.on(ui.config.clickEvent, function(){//绑定关闭按钮事件
            self.hide();
        });
        this.bindEsc && !ui.popup.bind.init && ui.popup.bind();
        $.onScroll( this.element[0] );        
    }
    ui.popup.prototype.addBtn = function(text,callback,color){
        /*
                       增加一个操作区按钮
        @text:按钮文字
        @color:按钮样式，即class类名
        @callBack:按钮click绑定的函数,"close"则为关闭
        */            
        if( text===undefined ){
            return;
        }
        this.operating.is(":hidden") && this.operating.show();
        this.button = this.button || [];
        
        var T = this,
            html = typeof text=='string' && /[<>]/.test(text),//自定义按钮html
            btn = $(html ? text : '<a href=""></a>'),
            color = color ? color : "",
            theme = this.theme.button || {}; 
                   
        if( typeof callback=='string' && callback!='close' ){//无回调时，第二个参数作为按钮颜色
            color = callback;
            callback = null;
        }    
        !html && btn.attr({
            "class" : color=='no' ? '' : theme.base + ' '+(theme[color]||'')
        });
        !html && btn.html(text);
        this.operating.append(btn);
        this.button.push(btn);
        
        if(callback) {
            callback = callback == "close" ? function(){
                T.hide();
            } : callback;
            
            btn.on(ui.config.clickEvent, function(){
                callback.call(T);
                return false;
            });
        }
    }
    ui.popup.item = {};//保存所有弹框实例对象
    ui.popup.clear = function(key){
        //清空弹框对象
        if(key){
            var win = ui.popup.item[key];
            win && clear(win);
        }else{
            for(var i in ui.popup.item){
                clear( ui.popup.item[i] );
            }
            ui.popup.item = {};
            ui.msg.win = null;
        }
        function clear( win ){
            win.self.remove();
            win = null;
        }
    }
    ui.popup.focus = {};//处于焦点的弹窗
    ui.popup.bind = function(){
        if( ui.popup.bind.init ){
            return;
        }
        ui.popup.bind.init = true;
        $(document).on("keydown", function(e){//按下esc键隐藏弹窗
            if( e.keyCode==27 ){
                var i, pop;
                for( i in ui.popup.focus ){
                    pop = ui.popup.focus[i];
                }
                pop && pop.bindEsc && pop.visible && pop.hide();
            }
        })
    }
    
    ui.msg = function(){
        /*
         * 消息提示框
         */
        var Win = {};
        
        ui.config.msg = {
            //不限宽度
            width : null
        }
        
        return {
            show : function( type, tip, opt ){
                var T = this,
                    C = type=='confirm';
                    
                opt = $.extend(true, {
                    title : C && '温馨提醒：',
                    bindEsc : C ? true : false
                }, ui.config.msg, opt);
                
                var C = type=='confirm',
                    timeout = opt.timeout!=undefined ? opt.timeout : 1600,
                    btn = opt.button,
                    win = Win[type];
                
                //隐藏其他
                this.hide(true);
                
                tip = tip || '';
                if(type=='loading'){
                    tip = tip || '正在处理请求,请稍候……';
                }else if(C){
                    btn = btn || [
                        ['确定',function(){
                            win.hide(function(){
                                typeof opt.ok=='function' && opt.ok.call(this);
                            });
                        },'submit'],
                        ['取消','close']
                    ];
                }
                if( !win || !$('#'+win.key).length ){
                    opt.name = 'msg_tip_win msg_tip_'+type + ' ' + (opt.name||'');
                    win = new ui.popup(opt);
                    //win.element.find('div.nj_overlay_wrap').addClass('msg_tip_'+type);
                    
                    win.set('title', opt.title);
                    win.set('content', '<div class="con clearfix"><i class="tip_ico"></i><span class="tip_con"></span></div>');
                    new ui.ico( win.content.find('i.tip_ico'), {type : C ? 'warn' : type} );
                    Win[type] = win;
                    
                    if( C ){
                        win.onShow = function(){
                            ui.layer.element.addClass('higher_layer');
                        }
                        win.onHide = function(){
                            ui.layer.element.removeClass('higher_layer');
                        }
                    }
                }
                win.layer = C ? true : opt.layer;
                //自动隐藏                            
                win.timeout = !C && type!='loading' && !opt.reload ? timeout : 0;
                if( opt.reload ){
                    setTimeout(function(){
                        if( opt.reload===true ){
                            location.reload();
                        }else if( typeof opt.reload=='string' ){
                            location.href = opt.reload;
                        }
                    }, 1500)
                }
                !btn && win.operating.hide().empty();//重设操作区
                
                win.set('button', btn );
                win.content.find('.tip_con').html(tip);
                win.show();
                C && win.button[0].focus();     
                return win;           
            },
            hide : function( now ){
                for( var i in Win ){
                    now && Win[i].element.addClass('v_hide');
                    Win[i].hide();
                }
            }        
        }
    }();
    
    ui.ico = function(dom, opt){
        /*
         * canvas/vml绘制的图标
         */        
        if( isNew = instaceofFun(this,arguments) ){
            return isNew;
        }
        //opt = $.extend( ui.config.ico, opt );
        opt = opt || {};
        this.hasCanvas = !!document.createElement('canvas').getContext;
        this.type = opt.type || 'ok';
        this.ico = $('<i class="nj_ico n_i_'+this.type+'"></i>');
        if( !(dom = getDom(dom)) ){
            return;
        }
        //dom && dom.length && dom.empty();
        //this.obj = dom || $('body:first');
        dom.html(this.ico);
        this.canvas = null;
        this.ctx = null;
        //this.ico.css('visibility','hidden');
        this.width = opt.width || this.ico.width() || 16;
        this.height = opt.height || this.ico.height() || 16;
        
        this.color = opt.color || this.ico.css('color');
        this.bgcolor = opt.bgcolor || this.ico.css('background-color');
        //this.ico.removeAttr('style');
        this.ico.css({
            'background' : 'none',
            'width' : this.width,
            'height' : this.height
        });
        this.createSpace();
    }
    ui.ico.prototype = {        
        createSpace : function(){
            var d = document;
            if(this.hasCanvas){
                this.canvas = d.createElement('canvas');
                this.ctx = this.canvas.getContext('2d');
                this.canvas.width = this.width;
                this.canvas.height = this.height;
                this.ico.append(this.canvas);
            }else{
                if(!ui.ico['iscreatevml']){//只创建 一次vml
                    var s = d.createStyleSheet(),
                        shapes = ['polyline','oval','arc','stroke','shape'];
                    d.namespaces.add("v", "urn:schemas-microsoft-com:vml"); //创建vml命名空间
                    for(var i=0;i<shapes.length;i++){
                        s.addRule("v\\:"+shapes[i],"behavior:url(#default#VML);display:inline-block;");
                    }
                    ui.ico['iscreatevml'] = true;
                }
                this.ico.css('position','relative');
            }
            this.draw();
        },
        drawLine : function(point,fill,border){
            var i,n = point.length;
            if(this.hasCanvas){
                this.ctx.beginPath();
                this.ctx.moveTo(point[0],point[1]);
                for(i=2;i<n;i+=2){
                    this.ctx.lineTo(point[i],point[i+1]);
                }
                this.ctx.stroke();
                fill&&this.ctx.fill();
            }else{
                var path = '',v = '';
                for(i=0;i<n;i+=2){
                    path += point[i]+','+point[i+1]+' ';
                }
                v += '<v:polyline strokeWeight="'+border+'" filled="'+(fill?'true':'false')+'" class="polyline" strokecolor="'+this.color+'" points="'+path+'" ';
                if(fill){
                    v += 'fillcolor="'+this.color+'"';
                }
                v += '/>';
                $(this.canvas).after(v);
            }
        },
        draw : function(){
            var startAngle,endAngle,border,point,
                p = Math.PI,
                width = this.width,
                height = this.height,
                color = this.color,
                bgcolor = this.bgcolor,
                ctx = this.ctx,
                canvas = this.canvas,
                type = this.type,
                d = document,
                T = this;
            if(type=='loading'){
                border = 3;
                if(this.hasCanvas){
                    startAngle = p / 180;
                    endAngle = 200*p / 180;
                    ctx.strokeStyle = this.color;
                    ctx.lineWidth = border;
                    window.setInterval(function(){
                        ctx.clearRect(0,0,width,height);
                        startAngle += 0.2;
                        endAngle += 0.2;
                        ctx.beginPath();
                        ctx.arc(width/2,height/2,width/2-border+1,startAngle,endAngle,false);
                        ctx.stroke();
                    },20);
                }else{
                    startAngle = 0;
                    border--;
                    this.canvas = d.createElement('<v:arc class="oval" filled="false" style="left:1px;top:1px;width:'+(width-border*2+1)+'px;height:'+(height-border*2+1)+'px" startangle="0" endangle="200"></v:arc>');
                    $(this.canvas).append('<v:stroke weight="'+border+'" color="'+color+'"/>');
                    this.ico.append(this.canvas);
                    window.setInterval(function(){
                        startAngle += 6;
                        startAngle = startAngle>360?startAngle-360:startAngle;
                        T.canvas.rotation = startAngle;
                    },15);
                }
            }else if( type=='ok' || type=='warn' || type=='error' || type=='close' ){
                if(this.hasCanvas){
                    ctx.beginPath();
                    ctx.fillStyle = bgcolor;
                    ctx.arc(width/2,height/2,width/2,p,3*p,false);
                    ctx.fill();
                    ctx.fillStyle = color;
                    ctx.strokeStyle = color;
                }else{
                    this.canvas = d.createElement('<v:oval class="oval" fillcolor="'+bgcolor+'" style="width:'+(width-1)+'px;height:'+(height-1)+'px;"></v:oval>');
                    $(this.canvas).append('<v:stroke color="'+bgcolor+'"/>');
                    this.ico.append(this.canvas);
                }
                
                if(type=='ok'){
                    point = [0.26*width,0.43*height , 0.45*width,0.59*height , 0.71*width,0.33*height , 0.71*width,0.47*height , 0.45*width,0.73*height , 0.26*width,0.57*height];
                    this.drawLine(point,true);
                }else if(type=='warn'){
                    if(this.hasCanvas){
                        ctx.beginPath();
                        ctx.arc(width*0.5,height*0.73,width*0.07,p,3*p,false);
                        ctx.stroke();
                        ctx.fill();
                    }else{
                        this.ico.append('<v:oval class="oval" fillcolor="#fff" style="width:'+height*0.16+'px;height:'+height*0.14+'px;left:'+(height*($.browser('ie6 ie7')?0.43:0.4))+'px;top:'+(height*0.68)+'px"><v:stroke color="#fff"/></v:oval>');
                    }
                    point = [0.45*width,0.22*height , 0.55*width,0.22*height , 0.55*width,0.54*height , 0.45*width,0.54*height];
                    this.drawLine(point,true);
                }else if(type=='error'||type=='close'){
                    if(!this.hasCanvas){
                        width = width*0.95;
                        height = height*0.95;
                    }
                    point = [0.33*width,0.30*height , 0.5*width,0.46*height , 0.68*width,0.30*height , 0.72*width,0.34*height , 0.55*width,0.52*height , 0.71*width,0.68*height , 0.68*width,0.73*height , 0.5*width,0.56*height , 0.34*width,0.72*height , 0.29*width,0.69*height , 0.46*width,0.51*height , 0.29*width,0.34*height];
                    this.drawLine(point,true);
                    function bind(){
                        if(T.hasCanvas){
                            T.ico.hover(function(){
                                ctx.clearRect(0,0,width,height);
                                ctx.beginPath();
                                ctx.fillStyle = color;
                                ctx.strokeStyle = bgcolor;    
                                ctx.arc(width/2,height/2,width/2,p,3*p,false);
                                ctx.fill();
                                ctx.stroke();
                                ctx.fillStyle = bgcolor;
                                T.drawLine(point,true);
                            },function(){
                                ctx.clearRect(0,0,width,height);
                                ctx.beginPath();
                                ctx.fillStyle = bgcolor;
                                ctx.strokeStyle = bgcolor;
                                ctx.arc(width/2,height/2,width/2,p,3*p,false);
                                ctx.fill();
                                ctx.stroke();
                                ctx.fillStyle = color;
                                ctx.strokeStyle = color;
                                T.drawLine(point,true);
                            })
                        }else{
                            T.ico.hover(function(){
                                var a = $(this).find('.oval')[0],b = $(this).find('.polyline')[0];
                                a.fillcolor = a.strokecolor = color;
                                b.fillcolor = b.strokecolor = bgcolor;
                            },function(){
                                var a = $(this).find('.oval')[0],b = $(this).find('.polyline')[0];
                                a.fillcolor = a.strokecolor = bgcolor;
                                b.fillcolor = b.strokecolor = color;
                            })
                        }
                    }
                    type=='close' && bind();
                }
            }else{
                //自定义绘图方法
                this['Draw'+type] && this['Draw'+type]();
            }
        }
    }
        
    function placeHolder(input,index){
        var w = input.innerWidth()*0.98,
            h = input.outerHeight(),
            id = input.attr('id'),
            v = input.attr('placeholder'),
            lab;
        
        index = index || 0;    
        id = id || 'ph_lab'+index;        
        lab = $('<label for="'+id+'" style="width:'+w+'px;height:'+h+'px" class="ph_lab ph_lab'+index+'">'+v+'</label>');
        
        if( $.browser('ie6 ie7') ){//for ie6/7
            input.wrap($('<span class="ph_wrap" style="position:relative;float:'+input.css('float')+'"></span>'));
            lab.css('left','0');
        }
        if( input[0].tagName.toLowerCase()=='input' ){
            lab.css( 'line-height', h+'px' );
        }
        input.attr({'id':id,'placeholder':''}).before(lab);
        input.on( 'blur propertychange', function(){
            setTimeout(function(){
                input.val()=='' ? lab.show() : lab.hide();
            },15)
        })
        setTimeout(function(){
            input.val()!='' && lab.hide();
        },150);
    };
    return ui;
    if( $.browser('ie') && $.browser.version<9 ){
        $(function(){
            var ph = $('[placeholder]'), i;
            for( i=0; i<ph.length; i++ ){
                placeHolder( ph.eq(i), i );
            }
        });
    }
    
    return ui;
});