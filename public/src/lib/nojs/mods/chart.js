/*
 * 数据图表
 * 2014-4-29
 */
define(function(require,$){
    var canvasSupport = !!document.createElement('canvas').getContext;
    
    function chart(options){
        this.options = options = $.extend(true, {
            axisColor : '#c8c8c8',
            gridColor : '#e8e8e8',
            //线条颜色及填充默认颜色 
            fillStyle : 'rgba(46,150,220,.2)',
            strokeStyle : 'rgba(46,150,220,.8)',
            animation : true,
            animationEasing : 'easeOutQuart',
            offset : {left:30, bottom:50, top:18, right:15, paddingTop:0, paddingBottom:0, paddingRight:0}
        }, options);
        
        var el = options.element;
        this.element = $(typeof el=='string' ? document.getElementById(el) : el).css('position','relative');
        this.data = options.data;
        /*
         * options.data = {labels:['1','2','3'], items:[
         *     {data : [18,28,38]},
         *     {data : [8,22,50]}
         * ]}
         */
        
        this.dataStep = null;//纵向栅格步长
        this.canvas = null;
        this.ctx = null;
        this.dataRatio = null;//像素/真实数据比率
        this.dataPoints = [];
        this.grid = {};//xy栅格数量
        this.labelPoints = [];
        this.offset = options.offset;
        
        //scaleFixed Y轴刻度显示数字 保留小数点位置 默认显示整数
        this.scaleFixed = parseInt(this.options.scaleFixed) || 0;
        
        this.init();
    }
    
    chart.prototype = {
        init : function(){
            if( canvasSupport ){
                this.canvas = $(document.createElement('canvas'));
                this.ctx = this.canvas[0].getContext('2d');
                this.element.css({
                    paddingTop : this.offset.paddingTop,
                    paddingBottom : this.offset.paddingBottom
                });
                this.canvas[0].width = this.element.width();
                this.canvas[0].height = this.element.height();
                
                this.element.append(this.canvas);
            }else{
                chart.createvml();
                this.canvas = this.element;
            }
            this.count();
        },
        count : function(){
            
            var width = this.canvas.width(),
                height = this.canvas.height(),
                offset = this.offset,
                data = this.data.items,
                n = data.length,
                i = 0, max = [], min = [], _data;
                
            for( ; i<n; i++ ){
                _data = data[i].data;
                max.push(Math.max.apply(null, _data));
                min.push(Math.min.apply(null, _data));
            }
            max = Math.max.apply(null, max);//获取所有数据中最大值
            min = Math.min.apply(null, min);
            //根据最大跨度以及画布大小自动调整dataStep
            var per = (max-min)/(height-offset.top-offset.bottom);//每像素数值
            this.dataStep = Math.round(per)*20;
            this.dataStep = this.dataStep==0 ? Math.round(per*10)*2 || 1 : this.dataStep;
            
            //console.log('max:'+max,'\nmin:'+min,'\n每像素数值:'+per,'\ndataStep:'+this.dataStep,'\n纵向栅格数：'+Math.ceil((max-min)/this.dataStep))
            
            var maxY = max%this.dataStep, minY = min%this.dataStep;
            max = max-(maxY==0 ? 0 : maxY - this.dataStep);//纵向栅格最大值
            min = min-(minY==0 ? 0 : minY);
            min = min>this.dataStep ? min : 0;
            this.grid.minY = min;
            
            //console.log('max:'+max,'\nmin:'+min);
            //根据最大值自动调整左侧保留宽度
            offset.left = (String(max).length + (this.scaleFixed ? this.scaleFixed+1 : 0)) * 10;
            
            this.attr = {
                width : width,
                height : height,
                max : max,
                min : min
            }
            canvasSupport && this.options.animation ? animationLoop(this) : this.draw();
        },
        coordinate : function(){
            //生成坐标系
            var width = this.attr.width,
                height = this.attr.height,
                max = this.attr.max,
                min = this.attr.min,
                offset = this.offset,
                i;
            //横向坐标轴X
            this.drawLine([offset.left,height-offset.bottom, width,height-offset.bottom], {
                fill : this.options.axisColor,
                stroke : this.options.axisColor
            });
            
            //纵向坐标轴Y
            this.drawLine([offset.left,0, offset.left,height-offset.bottom], {
                fill : this.options.axisColor,
                stroke : this.options.axisColor
            });
            
            //栅格X
            var gridY = (max-min)/this.dataStep;//纵向栅格数
            gridY = min ? ++gridY : gridY;
            var stepY = (height-offset.bottom-offset.top)/gridY, //每格像素数
                step = 0, y, _step;
            //像素/真实数据的比率
            this.dataRatio = stepY/this.dataStep; 
            this.grid.stepY = stepY;
            
            //console.log('纵向栅格数:'+gridY)
            
            for( i = 1; i<=gridY; i++ ){
                y = height-offset.bottom-stepY*i;
                this.drawLine([offset.left,y, width,y], {
                    stroke : this.options.gridColor
                });
                step += min && i==1 ? min : this.dataStep;
                _step = this.scaleFixed ? Number(step).toFixed(this.scaleFixed) : step;
                this.drawText(_step, offset.left-5, y, 'right', 'middle');
            }
            
            //栅格Y
            var stepX = (width-offset.left-offset.right)/(this.data.labels.length-1), x, y = height-offset.bottom;
                       
            for( i = 0; i<this.data.labels.length; i++ ){
                x = offset.left+i*stepX;
                this.drawLine([x,0, x,y], {
                    stroke : this.options.gridColor
                });
                this.drawText(this.data.labels[i], x, height, 'center', 'bottom', 'x');
                this.labelPoints.push(x);
            }
            //this.draw();
        },
        draw : function(percent){
            this.coordinate();
            //数据展示
            var data = this.data.items,
                n = data.length,
                width = this.canvas.width() - this.offset.right,
                height = this.canvas.height() - this.offset.bottom,//
                _height = height - (this.grid.minY ? this.grid.stepY : 0),
                self = this,
                arcPoint = [];
                
            percent = percent || 1;
            
            var i,j,item,point, x, y, _y, q;
            for( i = 0; i<n; i++ ){
                item = data[i].data;
                q = item.length;
                point = [];
                for( j=0; j<q; j++ ){
                    x = this.labelPoints[j];
                    _y = y = item[j];
                    if( this.grid.minY ){
                        y -= this.grid.minY;
                    }
                    y = _height - this.dataRatio*y*percent;
                    point.push(x, y);
                    
                    
                    (function(){
                        //记录圆点坐标 延后绘制                
                        var _data = {
                            arc : [x, y, 4, data[i].strokeStyle || self.options.strokeStyle]
                        };
                        if( self.options.showPointData ){
                            //圆点上方显示其数值
                            var first = j==0, last = j==q-1, px = 'center', py = 'bottom';
                            if( first ){
                                px = 'left'; py = 'middle';
                                x += 7;
                            }else if( last ){
                                px = 'right'; py = 'middle';
                                x -= 7;
                            }else{
                                y -= 5;
                            }
                            _data.text = [_y, x, y, px, py];
                        }
                        arcPoint.push(_data);
                    })();
                }
                //绘制折线本身
                this.drawLine(point, {
                    stroke : data[i].strokeStyle || this.options.strokeStyle,
                    lineWidth : 1.5
                });
                point.push(width, height);
                point.push(this.offset.left,height);
                point.push(this.offset.left,height-this.dataRatio*item[0]);
                //填充折线下面覆盖区域
                this.drawLine(point, {
                    fill : data[i].fillStyle || this.options.fillStyle
                });
            }
            //延后原点的绘制使其处于折线上方 
            this.drawArcPoint(arcPoint);
        },
        drawLine : function(point, options){
            //绘制线条
            var i,n = point.length,
                canvas = canvasSupport ? this.ctx : this.canvas;
            
            options = options || {};    
                
            if( canvasSupport ){
                canvas.save();
                canvas.beginPath();
                canvas.lineWidth = options.lineWidth;
                canvas.moveTo(point[0], point[1]);
                for( i=2; i<n; i+=2 ){
                    canvas.lineTo(point[i], point[i+1]);
                }
                if( options.stroke ){
                    canvas.strokeStyle = options.stroke;
                    canvas.stroke();
                }
                if( options.fill ){
                    canvas.fillStyle = options.fill;
                    canvas.fill();
                }
                //canvas.closePath();
                canvas.restore();
            }else{
                var path = '',v = '',
                    lineWidth = options.lineWidth || 1,
                    opacity = options.fill && options.fill.match(/(\d+,\d+,\d+),([\.\d]+)/),
                    rgb;
                
                if( opacity && opacity[2] ){
                    rgb = opacity[1].split(',');
                    options.fill = chart.RgbToHex(rgb[0],rgb[1],rgb[2],true);//rgba转为16进制
                    opacity = 'filter:alpha(opacity='+opacity[2]*100+')';//取出rgba中透明度
                }else{
                    opacity = '';
                }
                
                for( i=0; i<n; i+=2 ){
                    path += point[i]+','+point[i+1]+' ';
                }
                v += '<v:polyline filled="'+(options.fill?'true':'false')+'" class="polyline" style="position:absolute;'+opacity+'" points="'+path+'" ';
                if( options.fill ){
                    v += 'fillcolor="'+options.fill+'"';
                }
                if( options.stroke ){
                    v += 'strokeWeight="'+lineWidth+'" strokecolor="'+options.stroke+'"';
                }
                v += '/>';
                canvas.append(v);
            }
        },
        drawText : function(text, x, y, positionX, positionY, type){
            var position = '';
            //positionX : left center right
            //positionY : top middle bottom
            //文字
            if( canvasSupport ){
                this.ctx.save();
                if( type=='x' ){
                    this.ctx.translate(x,y);
                    this.ctx.rotate(-25 * Math.PI / 180); 
                    x = 22;
                    y = -30;
                    positionX = 'right';
                }
                this.ctx.fillStyle = '#888';                
                this.ctx.textAlign = positionX;
                this.ctx.textBaseline = positionY;
                
                this.ctx.fillText(text,x,y);
                this.ctx.restore();
            }else{
                if( positionY == 'right' ){
                    position = 'position:absolute;left:-100%;top:-50%';
                }else if( positionY == 'bottom' ){
                    position = 'position:absolute;bottom:100%;left:-50%';
                }
                this.canvas.append('<div style="position:absolute;left:'+x+'px;top:'+y+'px;color:#888;font-size:12px"><div style="'+position+'">'+text+'</div><div style="visibility:hidden">'+text+'</div></div>');
            } 
        },
        drawArc : function(x,y,width,fillStyle){
            //绘制圆形
            var canvas = canvasSupport ? this.ctx : this.canvas;
            if( canvasSupport ){
                canvas.save();
                canvas.beginPath();
                canvas.arc(x,y,width, 0, (Math.PI * 2), true);
                canvas.fillStyle = fillStyle;
                canvas.strokeStyle = 'rgba(255,255,255,.8)';
                canvas.lineWidth = 2;
                canvas.fill();
                canvas.stroke();
                canvas.restore();
            }else{
                canvas.append('<v:oval filled="true" fillcolor="'+fillStyle+'" strokeWeight="1.5" strokecolor="#fff" style="position:absolute;left:'+(x-width)+'px;top:'+(y-width)+'px;width:'+width*2+'px;height:'+width*2+'px"/>')
            }
        },
        drawArcPoint : function(point){
            var i=0, item;
            for( ; i<point.length; i++ ){
                item = point[i];
                this.drawArc.apply(this, item.arc);
                item.text && this.drawText.apply(this, item.text);
            }
        },
        clear : function(){
            this.ctx.clearRect(0, 0, this.attr.width, this.attr.height);
        }
    }
    
    //创建vml
    chart.createvml = function(){
        if( !chart.createvml.init ){
            var s = document.createStyleSheet(),
                shapes = ['polyline','oval','arc','stroke','shape'];
            document.namespaces.add("v", "urn:schemas-microsoft-com:vml"); //创建vml命名空间
            for( var i=0; i<shapes.length; i++ ){
                s.addRule("v\\:"+shapes[i],"behavior:url(#default#VML);display:inline-block;");
            }
            chart.createvml.init = true;
        }
    }
    
    //rgb转16进制 prefix是否带#
    chart.RgbToHex = function(R,G,B,prefix){
        var hex,strHex = '',color = [Math.round(R),Math.round(G),Math.round(B)];
        for(var i=0; i<color.length;i++){
            hex = Number(color[i]).toString(16);
            if(hex.length==1){
                hex = '0'+hex;
            }
            strHex += hex;
        }
        prefix && (strHex='#'+strHex);
        return strHex;
    }
    
    var requestAnimFrame = (function(){
        return window.requestAnimationFrame ||
            window.webkitRequestAnimationFrame ||
            window.mozRequestAnimationFrame ||
            window.oRequestAnimationFrame ||
            window.msRequestAnimationFrame ||
            function(callback) {
                window.setTimeout(callback, 1000 / 60);
            };
    })(),
    animationOptions = {
        easeOutExpo: function (t) {
            return (t==1) ? 1 : 1 * (-Math.pow(2, -10 * t/1) + 1);
        },
        easeOutQuart: function (t) {
            return -1 * ((t=t/1-1)*t*t*t - 1);
        }
    };
    
    /*
     * @Chart : 实例对象
     */
    function animationLoop(Chart){
        var amount = 1 / 60,
            easingFunction = animationOptions[Chart.options.animationEasing],
            complete = 0;
            
        requestAnimFrame(animLoop);
         
        function animateFrame(){
            var easeAnimationPercent = easingFunction(complete);
            Chart.clear();
            Chart.draw(easeAnimationPercent);
        }    
        function animLoop(){
            complete += amount;
            
            animateFrame();
            
            complete <= 1 && requestAnimFrame(animLoop);
        }
    }
    
    
    
    return chart;
});
