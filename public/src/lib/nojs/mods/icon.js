/**
 * 使用canvas/vml绘制图标
 * 主要是动画图标的实现
 * 2014-11-19
 * nolure@vip.qq.com
 */
define(function(require, exports){
    var $ = require('$'),
        ui = require('ui');

    function icon(dom, options){
        if( !(this instanceof icon) ){
            return new icon(dom, options);
        }
        this.options = options = $.extend(ui.config.icon, options);
        this.hasCanvas = !!document.createElement('canvas').getContext;
        this.type = options.type || 'loading';
        this.element = $('<i class="nj_icon nj_i_'+this.type+'"></i>');
        if( !(dom = ui.dom(dom)) ){
            return;
        }
        dom.html(this.element);
        this.canvas = null;
        this.ctx = null;
        this.width = options.width || this.element.width() || 16;
        this.height = options.height || this.element.height() || 16;
        
        this.color = options.color || this.element.css('color');
        this.bgcolor = options.bgcolor || this.element.css('background-color');
        this.element.css({
            'background' : 'none',
            'width' : this.width,
            'height' : this.height
        });
        this.createSpace();
    }
    icon.prototype = {        
        createSpace : function(){
            var d = document;
            if(this.hasCanvas){
                this.canvas = d.createElement('canvas');
                this.ctx = this.canvas.getContext('2d');
                this.canvas.width = this.width;
                this.canvas.height = this.height;
                this.element.append(this.canvas);
            }else{
                if(!icon['iscreatevml']){//只创建 一次vml
                    var s = d.createStyleSheet(),
                        shapes = ['polyline','oval','arc','stroke','shape'];
                    d.namespaces.add("v", "urn:schemas-microsoft-com:vml"); //创建vml命名空间
                    for(var i=0;i<shapes.length;i++){
                        s.addRule("v\\:"+shapes[i],"behavior:url(#default#VML);display:inline-block;");
                    }
                    icon['iscreatevml'] = true;
                }
                this.element.css('position','relative');
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
            var startAngle, endAngle, 
                border, point,
                p = Math.PI,
                width = this.width,
                height = this.height,
                color = this.color,
                bgcolor = this.bgcolor,
                ctx = this.ctx,
                T = this;

            if( this.type=='loading' ){
                border = 3;
                if( this.hasCanvas ){
                    startAngle = p / 180;
                    endAngle = 200*p / 180;
                    ctx.strokeStyle = this.color;
                    ctx.lineWidth = border;

                    var rotate = function(){
                        ctx.clearRect(0, 0, width, height);
                        startAngle += 0.15;
                        endAngle += 0.15;
                        ctx.beginPath();
                        ctx.arc(width/2,height/2,width/2-border+1,startAngle,endAngle,false);
                        ctx.stroke();
                    }
                }else{
                    startAngle = 0;
                    border--;
                    var style = 'left:1px;top:1px;width:'+(width-border*2+1)+'px;height:'+(height-border*2+1)+'px';
                    this.canvas = document.createElement('<v:arc class="oval" filled="false" style="'+style+'" startangle="0" endangle="200"></v:arc>');
                    $(this.canvas).append('<v:stroke weight="'+border+'" color="'+color+'"/>');
                    this.element.append(this.canvas);

                    var rotate = function(){
                        startAngle += 7;
                        startAngle = startAngle>360 ? startAngle-360 : startAngle;
                        T.canvas.rotation = startAngle;
                    }
                }
                ui.animate({
                    callback : rotate,
                    loop : true
                }) 
            }else{
                //自定义绘图方法
                this['Draw'+this.type] && this['Draw'+this.type]();
            }
        }
    }

    return icon;
})