/*
 * 无间断滚动
 */
define("lib/nojs/mods/scroll", [ "lib/jquery/jquery", "lib/nojs/ui" ], function(require) {
    var $ = require("lib/jquery/jquery"), ui = require("lib/nojs/ui");
    function scroll(element, opt) {
        this.element = typeof element == "string" ? $("#" + element) : element;
        if (!this.element || !this.element.length) {
            return;
        }
        this.wrap = this.element.find(".nj_g_wrap").first();
        this.con = this.wrap.find(".nj_g_con").first();
        this.item = this.con.children();
        this.len = this.item.length;
        this.opt = opt = opt || {};
        this.direction = opt.direction || "y";
        //滚动方向，默认纵向
        this.step = typeof opt.step !== "undefined" ? parseInt(opt.step) : 1;
        //滚动步长，0为连续滚动
        this.time = opt.time || (this.step ? 6e3 : 30);
        //滚动速度，连续推荐设置40ms ;间断滚动时，该值为滚动的间隔时间
        this.size = null;
        this.view = null;
        //可见区域的个数	
        this.repeat = opt.repeat == false ? false : true;
        //是否重复循环无间断
        this.auto = opt.auto == false ? false : true;
        this.index = 0;
        //当前位置起始index
        this.init();
    }
    scroll.prototype = {
        init: function() {
            var T = this;
            this.totalLength = this.len;
            //总个数 包含追加
            this.scrollLength = 0;
            //已滚动个数
            $(window).on("resize", function() {
                T.reset();
            });
            this.reset();
            if (this.len <= this.view) {
                return;
            }
            var nextLast = this.len % this.view;
            //初始化的追加个数 保证next即可 
            //next所需:this.view-nextLast
            //this.step==0连续滚动时 拷贝this.view个即可
            nextLast && this.append(0, this.step ? this.view - nextLast : this.view);
            if (this.direction == "y") {
                this.size.total = this.con.height();
            }
            this.start();
            this.element.hover(function() {
                T.stop();
            }, function() {
                T.start();
            });
            //mobile touch
            if (screen.width <= 640) {
                var prevAction = T.direction == "y" ? "swipeDown" : "swipeRight", nextAction = T.direction == "y" ? "swipeUp" : "swipeLeft";
                ui.touch(function() {
                    T.wrap[prevAction](function() {
                        T.scroll(false);
                        return false;
                    });
                    T.wrap[nextAction](function() {
                        T.scroll();
                        return false;
                    });
                });
            }
        },
        /*
         * 使用向后追加元素的方式来实现不间断滚动
         * 初始化追加一次 ；每次滚动完毕后追加
         */
        append: function(start, length) {
            if (!this.repeat) {
                return;
            }
            var copy, //剩余一次可截取个数
            last = this.len - start, c;
            if (length > last) {
                copy = this.item.slice(start).clone();
                //从当前copy到结尾
                start = 0;
                length = length - copy.length;
            }
            c = this.item.slice(start, start + length).clone();
            copy = copy ? copy.add(c) : c;
            this.con.append(copy);
            this.totalLength = this.con.children().length;
            //追加后的总个数
            if (this.direction == "x") {
                this.size.total = this.totalLength * this.size.item;
                this.con.width(this.size.total);
            }
        },
        start: function() {
            var T = this;
            if (this.auto && this.len > this.view) {
                clearInterval(T.A);
                this.A = setInterval(function() {
                    T.scroll();
                }, T.time);
            }
        },
        stop: function() {
            this.A = clearInterval(this.A);
        },
        scroll: function(next) {
            /*
		     * next 
		     * boolean: 向前/后滚动 控制方向
		     * number: 索引值 直接滚动到某一张 （弱repeat=true 改索引是相对追加之前的）
		     */
            var index;
            if (typeof next == "number") {
                index = getIndex(next, this.len);
            } else {
                next = next === false ? false : true;
            }
            //if( this.wrap.is(":animated") ) { return;}
            this.wrap.stop();
            var T = this, m, speed = 0, //每次滚动距离，连续-每次增加1px，间隔-每次增加n个元素的宽高
            //计算最大滚动差
            max = T.size.total - T.size.box, scrollAttr = this.direction == "x" ? "scrollLeft" : "scrollTop", attr = {}, now = this.wrap[scrollAttr](), nowScroll, ratio = next ? 1 : -1;
            if (this.step == 0) {
                m = 1;
            } else {
                m = this.step * this.size.item;
                speed = 800;
            }
            if (this.step) {
                m = ratio * m;
                //不足prev时 向后跳转this.len的个数
                if (!next && this.scrollLength < this.step && typeof index == "undefined") {
                    var prevLast = this.totalLength - (this.scrollLength + this.len);
                    if (prevLast < this.view) {
                        this.append(this.totalLength % this.len, this.view - prevLast);
                    }
                    T.wrap[scrollAttr](T.wrap[scrollAttr]() + T.size.item * T.len);
                    this.scrollLength += this.len;
                }
                this.scrollLength += ratio * this.step;
            } else {
                //连续滚动
                this.scrollLength = Math.floor(now / T.size.item);
            }
            this.index = this.scrollLength % this.len;
            //当前开始index
            if (typeof index == "undefined") {
                attr[scrollAttr] = "+=" + m;
                this[scrollAttr] = nowScroll = now + ratio * m;
            } else {
                this.scrollLength = index;
                this.index = index;
                attr[scrollAttr] = this[scrollAttr] = nowScroll = now = T.size.item * index;
            }
            this.endIndex = getIndex(this.index + this.view - 1, this.len);
            //当前结束index
            this.wrap.animate(attr, speed, "easeOutExpo", function() {
                if (nowScroll >= T.len * T.size.item) {
                    //滚动过得距离超过总长度  则向前跳转一次
                    var newPos = T.step ? T.size.item * T.index : 0;
                    T.wrap[scrollAttr](newPos);
                    T.scrollLength = T.index = T.step ? T.index : newPos;
                }
                var last = T.totalLength - T.scrollLength - T.view;
                if (last < T.view) {
                    //需再次追加 此处step=0不会存在
                    T.append(getIndex(T.endIndex + last + 1, T.len), T.view - last);
                }
                T.opt.onScrollEnd && T.opt.onScrollEnd.call(T);
            });
            this.opt.onScroll && this.opt.onScroll.call(this, this.index);
        },
        reset: function() {
            //window reset时更新this.size/this.view 
            //适应多分辨率时 设置computed=true可以自动为this.item设置尺寸 因为css中无法设置
            if (this.opt.computed) {
                var attr, value;
                if (this.direction == "x") {
                    value = this.wrap.width();
                    attr = "width:" + value + "px;height:" + value / this.opt.computed + "px";
                } else {
                    value = this.wrap.height();
                    attr = "width:" + value * this.opt.computed + "px;height:" + value + "px";
                }
                this.con.children().attr("style", attr);
            }
            this.size = {
                box: this.direction == "x" ? this.wrap.width() : this.wrap.height(),
                //容器尺寸
                total: this.direction == "x" ? null : this.con.height(),
                //内容总尺寸
                item: this.direction == "x" ? this.item.outerWidth(true) : this.item.outerHeight(true)
            };
            if (this.direction == "x") {
                this.size.total = this.totalLength * this.size.item;
                this.con.width(this.size.total);
            }
            this.view = Math.ceil(this.size.box / this.size.item);
            if (this.opt.step == "view") {
                this.step = this.view;
            }
        }
    };
    function getIndex(index, total) {
        index = index < 0 ? 0 : index;
        index = index > total ? index % total : index;
        return index;
    }
    return scroll;
});
