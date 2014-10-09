/*
 * 瀑布流图片布局
 * 采用绝对定位，自适应方式，固定列宽
 * @id:容器id
 * @opt:{autoWidth:自适应宽度,autoLoad:滚动加载数据}
 * @load数据加载方法
 */
define("lib/nojs/mods/waterfall", [ "lib/jquery/jquery" ], function(require) {
    var $ = require("lib/jquery/jquery");
    function imgPreLoad() {
        var list = [], intervalId = null, // 用来执行队列
        tick = function() {
            var i = 0;
            for (;i < list.length; i++) {
                list[i].end ? list.splice(i--, 1) : list[i]();
            }
            !list.length && stop();
        }, // 停止所有定时器队列
        stop = function() {
            clearInterval(intervalId);
            intervalId = null;
        };
        return function(url, ready, load, error) {
            var onready, width, height, newWidth, newHeight, img = new Image();
            img.src = url;
            // 如果图片被缓存，则直接返回缓存数据
            if (img.complete) {
                ready.call(img);
                load && load.call(img);
                return;
            }
            width = img.width;
            height = img.height;
            // 加载错误后的事件
            img.onerror = function() {
                error && error.call(img);
                onready.end = true;
                img = img.onload = img.onerror = null;
            };
            // 图片尺寸就绪
            onready = function() {
                newWidth = img.width;
                newHeight = img.height;
                if (newWidth !== width || newHeight !== height || // 如果图片已经在其他地方加载可使用面积检测
                newWidth * newHeight > 1024) {
                    ready.call(img);
                    onready.end = true;
                }
            };
            onready();
            // 完全加载完毕的事件
            img.onload = function() {
                // onload在定时器时间差范围内可能比onready快
                // 这里进行检查并保证onready优先执行
                !onready.end && onready();
                load && load.call(img);
                // IE gif动画会循环执行onload，置空onload即可
                img = img.onload = img.onerror = null;
            };
            // 加入队列中定期执行
            if (!onready.end) {
                list.push(onready);
                // 无论何时只允许出现一个定时器，减少浏览器性能损耗
                if (intervalId === null) {
                    intervalId = setInterval(tick, 40);
                }
            }
        };
    }
    var waterfall = function(id, opt, load) {
        this.element = $("#" + id);
        //显示容器
        if (!this.element.length) {
            return;
        }
        this.opt = opt || {};
        this.item = null;
        //列表个体
        this.temp = [];
        //存储临时数据，对象
        this.N = null;
        this.state = null;
        //取值插入状态
        this.load = waterfall.loadData;
        //加载数据函数
        this.ready = null;
        //已排序完成的个数
        this.loading = null;
        //是否加载数据中
        this.preLoadimg = this.opt.preLoadimg == true ? imgPreLoad() : false;
        //服务器不返回图片高度时，通过图片预加载获取其高度
        this.onSort = this.opt.onSort;
        //排序时回调
        this.page = null;
        if (this.opt.autoWidth || this.opt.autoLoad) {
            this.bindScroll();
        }
        this.init();
    };
    waterfall.prototype = {
        init: function(I) {
            var T = this, m, h;
            this.item = this.element.find("div.waterfall_item");
            this.N = {
                colWidth: null,
                //每个区块的实际占位宽
                cols: null,
                //计算出的列数
                colsPos: []
            };
            this.temp = [];
            this.ready = 0;
            this.state = true;
            this.page = 1;
            if (!this.item.length) {} else {
                for (var i = 0; i < this.item.length; i++) {
                    m = this.item.eq(i);
                    this.temp[i] = m;
                    m.css("opacity", "0");
                    h = m.find(".pic img");
                    if (!h.length) {
                        continue;
                    }
                }
                this.insert(null, true);
            }
        },
        bindScroll: function() {
            var T = this, A, B, w = $(window);
            //窗口尺寸改变时重新布局 autoWidth
            function autoLayout() {
                window.clearTimeout(A);
                A = window.setTimeout(function() {
                    if (T.N.cols && Math.floor((T.element.parent().width() + T.N.margin) / T.N.colWidth) != T.N.cols) {
                        //判断当前列数是否改变
                        T.init(true);
                    }
                }, 400);
            }
            //自动加载数据
            function autoload() {
                if (T.loading) {
                    return;
                }
                var h;
                window.clearTimeout(B);
                B = window.setTimeout(function() {
                    h = w.height() - (Math.min.apply(null, T.N.colsPos) + T.element.offset().top - w.scrollTop());
                    if (h + 100 > 0) {
                        //最短列距最底部的最小距离
                        T.load.call(T);
                    }
                }, 10);
            }
            if (T.opt.autoWidth) {
                w.resize(autoLayout);
            }
            if (T.opt.autoLoad) {
                w.on("scroll.autoload", autoload);
            }
        },
        insert: function(t, I) {
            var T = this;
            if (!this.temp.length) {
                return;
            }
            var n = this.temp.shift(), //当前插入的对象
            col = n.attr("data-col") || 1, //当前对象所占列数
            _n;
            this.onSort && this.onSort(n);
            this.item = this.element.find("div.waterfall_item");
            _n = this.item.length;
            //当前总条数
            if (!this.ready) {
                n.css({
                    left: "0",
                    top: "0"
                });
            } else if (this.ready < this.N.cols) {
                n.css({
                    left: this.ready * this.N.colWidth,
                    top: "0"
                });
            } else {
                var min = [ 0, this.N.colsPos[0] ], i = 0;
                for (;i < this.N.cols; i++) {
                    if (this.N.colsPos[i] < min[1]) {
                        min = [ i, this.N.colsPos[i] ];
                    }
                }
                n.css({
                    left: min[0] * this.N.colWidth,
                    top: min[1]
                });
            }
            this.ready += col;
            n.css("display", "block");
            function next() {
                T.getSize(n, col);
                n.fadeTo(10, 1);
                if (T.temp.length) {
                    setTimeout(function() {
                        T.insert(null, I);
                    }, 1);
                } else {
                    //排序完毕
                    T.state = false;
                }
            }
            function Call() {
                var img = n.find(".pic img");
                if (T.preLoadimg && img.length) {
                    T.preLoadimg(img.attr("src"), function() {
                        //此处获取的是图片的真实尺寸，而容器中显示的是压缩后的
                        var k = img.width() / this.width;
                        img.height(this.height * k);
                        next();
                    });
                } else {
                    next();
                }
            }
            if (!I) {
                n.appendTo(this.element);
            }
            Call();
        },
        dealData: function(t) {
            var n = t.length, i = 0, m;
            if (!n) {
                return;
            }
            this.temp = [];
            for (;i < n; i++) {
                m = $(document.createElement("div")).attr("class", "waterfall_item");
                m.html(t[i]).css("opacity", "0");
                //h = m.find('.pic img').attr('height');
                //m.find(".pic").height(h);
                this.temp[i] = m;
            }
            this.insert();
        },
        //@col:obj所占列数
        getSize: function(obj, col) {
            this.item = this.element.find("div.waterfall_item");
            var n = this.item.length, cols, w;
            if (!n) {
                return;
            }
            if (!this.N.colWidth) {
                this.N.colWidth = obj.outerWidth(true);
                this.N.margin = this.N.colWidth - obj.outerWidth();
                this.N.colWidth /= col;
            }
            cols = Math.floor((this.element.parent().width() + this.N.margin) / this.N.colWidth);
            if (this.N.cols != cols) {
                this.N.cols = cols;
                w = cols * this.N.colWidth;
                if (w != this.element.parent().width()) {
                    this.element.width(w);
                }
            }
            //记录列位置
            var i = 0, h, l, nowCol, max;
            h = obj.outerHeight(true);
            h += parseInt(obj.css("top"));
            l = parseInt(obj.css("left"));
            nowCol = parseInt(l / this.N.colWidth);
            //obj当前所处列			
            for (var i = 0; i < col; i++) {
                this.N.colsPos[nowCol++] = h;
            }
            max = Math.max.apply(null, this.N.colsPos);
            //在所有列中取最大值即为容器高度
            max > 200 && this.element.height(max);
        },
        //重置obj所在列位置
        setCol: function(obj) {
            var next = obj.nextAll(), len = next.length, left = parseInt(obj.css("left")), col = left / this.N.colWidth, h = parseInt(obj.css("top")) + obj.outerHeight(true), max = 0;
            for (var i = 0; i < len; i++) {
                m = next.eq(i);
                if (parseInt(m.css("left")) / this.N.colWidth == col) {
                    if (i > max) {
                        max = i;
                    }
                    m.css("top", h);
                    h += m.outerHeight(true);
                }
            }
            this.N.colsPos[col] = parseInt(next.eq(max).css("top")) + next.eq(max).outerHeight(true);
        }
    };
    //瀑布流加载数据	
    waterfall.dataTmpl = function(data) {
        var html = [ '<a class="pic" href="productreview-<%=id%>.html"><img src="<%=pic%>" />', '<span class="tit"><%=title%></span>', "</a>" ].join("");
        return $.tmpl(html, data);
    };
    waterfall.loadData = function() {
        return function() {
            var temp, page = this.page, T = this;
            //此处this指向瀑布流对象waterFall
            if (page > 2) {
                this.opt.over && this.opt.over.call(this);
                //$(window).off('scroll.autoload');
                return;
            }
            if (this.loading || this.state) {
                return;
            }
            this.loading = true;
            this.page = ++page;
            this.opt.start && this.opt.start.call(T);
            var key = this.opt.key, url = this.opt.url, dataType = this.opt.dataType || "html";
            if (key) {
                url += (url.indexOf("?") > 0 ? "&" : "?") + key + "=" + page;
            }
            $.getJSON(url, function(json) {
                T.loading = false;
                T.opt.end && T.opt.end.call(T, json);
                if (json.status != 1) {
                    return;
                }
                var data = json.data, i;
                if (data) {
                    if (typeof T.opt.data == "function") {
                        data = T.opt.data(json);
                        if (!data) {
                            return;
                        }
                    }
                    if (dataType == "html") {
                        data = $(data);
                        T.temp = [];
                        for (i = 0; i < data.length; i++) {
                            T.temp[i] = data.eq(i).css("opacity", "0");
                        }
                        T.insert();
                    } else {
                        temp = [];
                        for (i = 0; i < data.length; i++) {
                            temp[i] = waterfall.dataTmpl(data[i]);
                        }
                        T.dealData(temp);
                    }
                }
            });
        };
    }();
    return waterfall;
});
