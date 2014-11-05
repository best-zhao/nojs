/**
 * 弹层相关组件
 * 包含浮动层，弹窗，遮罩，消息提示窗
 */
define(function(require){
    var $ = require('$'), ui = require('ui'), layer = {};

    /*
     * 浮动层
     */
    
    layer.overlay = function(options){
        options = $.extend(true, {}, ui.config.overlay, options);
        //className主要用于全局配置 name则用于单个实例配置
        options.className = [options.className || '', options.name || ''].join(' '); 
        
        var insertTo = (options.parent ? window.parent : window).document;
        options.insertTo = options.insertTo=='body' ? insertTo.body : $(insertTo).find(options.insertTo);

        
        layer.overlay.baseConstructor.call(this, options);

        this.visible = false;//可视状态
        this.content = null;//内容区域
        this.arrow = this.options.arrow;//箭头 根据align对齐方式自动调整指向
        this.timeout = this.options.timeout;
        this.onShow = this.options.onShow;
        this.onHide = this.options.onHide;
        layer.overlay.item.push(this);
        this.init();
    };
    ui.config.overlay = $.extend({
        showClassName : 'nj_overlay_show',
        insertTo : 'body'
    }, ui.config.overlay);

    ui.extend(layer.overlay, ui.align);
    ui.extend.proto(layer.overlay, {
        set : function(fn, key, value){
            if( key=='content' ){
                this.content.empty().append(value);
            }else{
                fn.call(this, value);
            }
        }
    });
    layer.overlay.item = [];
    layer.overlay.hide = function(){
        var item = layer.overlay.item,
            n = item.length,
            i = 0;
        for( ; i<n; i++ ){
            item[i].hide();
        }
    };
    layer.overlay.prototype.init = function(){
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
    layer.overlay.prototype.show = function(callback){
        
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
    layer.overlay.prototype.hide = function(callback){
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
    layer.overlay.prototype.on = function(options){
        options = options || {};
        
        var self = this,
            mode = options.mode || ui.config.eventType,
            agent = $.type(options.element)=='array' && options.element.length>1,
            hasNearby = !!this.nearby,
            element = ui.dom(agent ? options.element[0] : options.element) || this.nearby,
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
    layer.overlay.prototype.destroy = function(){
        this.element.remove();
    }
       
    layer.mask = function(){
        /*
         * 遮罩层
         */
        var w = $(window),
            layer = $("#nj_layer"),
            arr = { show : show, hide : hide },
            effect;
        function init(){
            layer = $('<div id="nj_layer" class="nj_layer"></div>').appendTo(document.body);
            if( $.browser.ie && parseInt($.browser.version)==6 ){
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
    
    layer.popup = function( options ){
        options = $.extend(true, {}, ui.config.popup, options);
        
        options.name = ['nj_win', options.name || ''].join(' '); 
        options.nearby = options.nearby || (options.parent?window.parent:window);
        
        layer.popup.baseConstructor.call(this, options);
        
        this.theme = options.themeItem[options.theme];
        this.close = null;
        this.title = null;
        this.operating = null;
        this.mask = options.mask==false ? false : true;
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
        width : 400,
        theme : 'default',
        className : 'drop_pop',
        showClassName : 'drop_pop_show'
    }
    ui.extend(layer.popup, layer.overlay);
    ui.extend.proto(layer.popup, {        
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
            this.mask && layer.mask.show();
            fn.call(this, callback);

            
            //this.bindEsc && layer.popup.focus.push(this);
            if( this.bindEsc && !layer.popup.focus[this.key] ){
                layer.popup.focus[this.key] = this;
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
                hideMask = this.mask;
            /*
             * onbeforehide:关闭之前确认
             */
            if( this.onbeforehide && !this.onbeforehide() ){
                return;
            }
            fn.call(self, callback);
            
            this.mask && $.each(layer.popup.item, function(){//检测其他弹窗看是否需要保留遮罩
                if( this.key != self.key && this.visible && this.mask ){
                    hideMask = false;
                    return false;
                }
            })
            hideMask && layer.mask.hide();
            delete layer.popup.focus[this.key];
        }
    })
    layer.popup.prototype.create = function(){
        var self = this,
            id = 'nj_popup_' + (+new Date);
        
        layer.popup.item[id] = this;
        this.key = id;
        
        this.set('content', [
            '<span class="win_close nj_ico n_i_close">×</span><div class="win_tit"></div>',
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
        
        this.close.on(ui.config.clickEvent, function(){//绑定关闭按钮事件
            self.hide();
        });
        this.bindEsc && !layer.popup.bind.init && layer.popup.bind();
        $.onScroll( this.element[0] );        
    }
    layer.popup.prototype.addBtn = function(text,callback,color){
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
    layer.popup.item = {};//保存所有弹框实例对象
    layer.popup.clear = function(key){
        //清空弹框对象
        if(key){
            var win = layer.popup.item[key];
            win && clear(win);
        }else{
            for(var i in layer.popup.item){
                clear( layer.popup.item[i] );
            }
            layer.popup.item = {};
            layer.msg.win = null;
        }
        function clear( win ){
            win.self.remove();
            win = null;
        }
    }
    layer.popup.focus = {};//处于焦点的弹窗
    layer.popup.bind = function(){
        if( layer.popup.bind.init ){
            return;
        }
        layer.popup.bind.init = true;
        $(document).on("keydown", function(e){//按下esc键隐藏弹窗
            if( e.keyCode==27 ){
                var i, pop;
                for( i in layer.popup.focus ){
                    pop = layer.popup.focus[i];
                }
                pop && pop.bindEsc && pop.visible && pop.hide();
            }
        })
    }
    
    layer.msg = function(){
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
                    bindEsc : C ? true : false,
                    timeout : 1500,
                    //默认只有confirm显示遮罩
                    mask : C ? null : false,

                }, ui.config.msg, opt);
                
                var btn = opt.button,
                    win = Win[type];
                
                //隐藏其他
                this.hide(true);
                
                tip = tip || '';
                if(type=='loading'){
                    tip = tip || '正在处理请求,请稍候……';
                }else if( C ){
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
                    win = new layer.popup(opt);
                    
                    win.set('title', opt.title);
                    win.set('content', '<div class="con clearfix"><i class="tip_ico nj_ico n_i_'+(C?'warn':type)+'">'+(ui.config.iconText[type]||'')+'</i><span class="tip_con"></span></div>');
                    Win[type] = win;
                    
                    if( C ){
                        win.onShow = function(){
                            layer.mask.element.addClass('higher_layer');
                        }
                        win.onHide = function(){
                            layer.mask.element.removeClass('higher_layer');
                        }
                    }
                }
                //自动隐藏
                win.timeout = !C && type!='loading' && !opt.reload ? opt.timeout : 0;

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

    return layer;
});