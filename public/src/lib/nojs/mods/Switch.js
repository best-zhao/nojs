/*
 * tab side
 * nolure@vip.qq.com
 */
define(function(require){
    /*
     * switch原型超类|幻灯片、选项卡等
     */
    var $ = require('$'), ui = require('ui');
    function Tab(element, options){
        if( !(this instanceof Tab) ){
            return new Tab(element, options);
        }
        if( !(this.element = ui.dom(element)) ){
            return;
        }
        this.menu = this.element.find(".nj_s_menu").first();
        this.menuItem = this.menu.find(".nj_s_m");
        this.wrap = this.element.find(".nj_s_con").first();
        this.item = this.wrap.children(".nj_s_c");
        this.length = this.item.length;
        if(!this.length){return;}
        this.options = options = options || {};
        this.mode = options.mode || ui.config.eventType;
        this.onChange = options.onChange;
        this.onHide = options.onHide;
        this.index = this.getIndex(options.firstIndex);
        this.rule = options.rule || this.rule;
        this.options.start = this.options.start===false ? false : true;
        this.bind();
    }
    Tab.prototype = {
        bind : function(){
            var self = this,
                A,m,
                delay = this.mode=='mouseover' ? 100 : 0;//延迟触发
                
            if( !this.menuItem ){
                return;
            } 
               
            this.menuItem.on(this.mode+'.nj_switch', function(){
                m = $(this);
                if( m.hasClass('current') ){
                    return false;
                }
                self.onTrigger && self.onTrigger();
                A = setTimeout(function(){
                    self.change(self.menuItem.index(m));
                }, delay)
                return false;
            }).mouseout(function(){
                A = clearTimeout(A);
            })
            this.options.start && this.change(this.index);
        },
        getIndex : function(index){
            index = parseInt(index) || 0;
            index = index>(this.length-1) ? 0 : index;
            index = index<0 ? (this.length-1) : index;
            return index;
        },
        change : function(index){
            index = this.getIndex(index);
            if( this.rule ){
                if( this.rule.call(this, index)===false ){
                    return false;
                }
            }else{
                this.item.eq(index).show().siblings().hide();
                this.menuItem.eq(index).addClass("current").siblings().removeClass("current");
            }
            
            this.onHide && this.index!=index && this.onHide.call(this, this.index);
            this.index = index;
            this.onChange && this.onChange.call(this, index);
        }
    };
    
    /*
     * slide幻灯片 继承至Tab
     */    
    function Slide(element, options){
        Slide.baseConstructor.call(this, element, options);
        if( !this.element ){
            return;
        }
        this.play = null;
        this.time = this.options.time || 5000;
        this.auto = this.options.auto===false ? false : true;
        this.stopOnHover = this.options.stopOnHover===false ? false : true;
        
        var self = this;
        this.stopOnHover && this.element.hover(function(){
            self.play = clearInterval(self.play);
        },function(){
            self.start();
        })
        this.getNum();
        this.options.start && this.start(true);
    }
    ui.extend(Slide, Tab);
    Slide.prototype.getNum = function(){
        if( this.menu.children().length ){
            return;
        }
        
        var list = '';
        for( var i=1; i<=this.length; i++ ){
            list += '<li class="nj_s_m">'+i+'</li>';
        }
        this.menu.append(list);
        this.menuItem = this.menu.find('.nj_s_m');
        this.bind();
    }
    Slide.prototype.onTrigger = function(){
        //手动触发时要重新开始计时，避免时间重合
        !this.stopOnHover && this.start();
    }
    Slide.prototype.rule = function(index){
        //切换规则        
        this.item.eq(index).fadeIn(400).siblings().hide();
        this.menuItem.eq(index).addClass("current").siblings().removeClass("current");
        this.index = index;
    }
    Slide.prototype.start = function(startNow){
        //开始播放
        var self = this;
        if( !this.auto || this.length<2 ){
            return;
        }
        startNow && this.change(this.index);
        
        clearInterval(self.play);
        self.play = setInterval(function(){
            self.change(++self.index);
        }, self.time);
    }
    
    return {
        tab : Tab,
        slide : Slide
    };
});
