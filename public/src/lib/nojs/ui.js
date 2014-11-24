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
    
    //更改ui组件配置    
    ui.config = function(options){
        options = options || {};
        for( var i in options ){
            ui.config[i] = $.extend(true, ui.config[i], options[i]);
        }
    };  
    ui.config.eventType = ui.mobile ? 'tap' : 'mouseover';
    ui.config.clickEvent = ui.mobile ? 'tap' : 'click';
    ui.config.iconText = {
        ok : '&#xe60f;',
        warn : '&#xe622;',
        error : '&#xe60e;',
        confirm : '&#xe622;'
    }
    
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

    //动画
    ui.animate = (function(){
        var requestAnimFrame =  window.requestAnimationFrame ||
            window.webkitRequestAnimationFrame ||
            window.mozRequestAnimationFrame ||
            window.oRequestAnimationFrame ||
            window.msRequestAnimationFrame ||
            function(callback) {
                window.setTimeout(callback, 1000 / 60);
            }

        function animate(options){
            options = options || {};
            if( !options.callback ){
                return;
            }
            var callback = options.callback,
                loop = options.loop,//是否为无限循环动画
                speed = options.speed || 1,
                //对于无限循环的动画speed无用 在callback中设置每次变化步长即可
                amount = speed / 60,
                easing = options.easing || 'easeOutExpo',
                easingFunction = animate.easings[easing],
                complete = 0;

            requestAnimFrame(animLoop);

            function animLoop(){
                complete += amount;
                var call = callback(easingFunction(complete));//callback返回false可停止动画
                if( call===false || (!loop && complete>1) ){
                    //防止动画结束时complete大于1而超出目标值
                    !loop && complete>1 && callback(1);
                    return;
                }
                requestAnimFrame(animLoop);
            }
        }
        animate.easings = {
            linear : function (t){
                return t;
            },
            easeOutExpo: function (t) {
                return (t==1) ? 1 : 1 * (-Math.pow(2, -10 * t/1) + 1);
            },
            easeOutQuart: function (t) {
                return -1 * ((t=t/1-1)*t*t*t - 1);
            }
        }
        return animate;
    })();
    
    /* 
     * [jQuery animate动画扩展]
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
        
        //relative=true 表示定位方式同css背景定位方式
        this.relative = options.relative!=undefined ? options.relative : screen ? true : false;
        
        this.fixed = options.fixed==undefined && screen ? 'fixed' : options.fixed;//null fixed animate

        var ie6 = $.browser.ie && parseInt($.browser.version)==6;
        this.cssFixed = this.fixed=='fixed' && !ie6 && screen;//可以直接使用position:fixed来定位
        
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
    return ui;
});