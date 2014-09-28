/*
 * 滚动条滚动到某位置时固定某元素
 * 2014-2-28
 * nolure@vip.qq.com
 */
define("lib/nojs/mods/fixed", [], function(require, $) {
    var win = $(window), ie6 = $.browser("ie6");
    //固定元素在某个位置
    //****注：如果element内部元素存在margin溢出的话要用hack对element元素清除 否则element.outerHeight()会计算出错
    var fixed = function(element, options) {
        element = typeof element == "string" ? $("#" + element) : element;
        if (!element || !element.length) {
            return;
        }
        options = options || {};
        options.element = element;
        options.wrap = options.wrap || win;
        !fixed.init && fixed.bind(options);
        //options.name = options.name || 'page_fixed';
        options.offset = options.offset || 0;
        options.top = element.offset().top;
        //初始位置top
        options.state = 0;
        //3种状态
        options.Float = /absolute|fixed/.test(element.css("position"));
        //浮动元素
        options.style = options.element.attr("style") || "";
        //保留原style
        //options.width = element.width();
        var width = element.outerWidth(), height = element.outerHeight(true);
        /*
         * options.until：直到遇到某个对象时停止固定  
         * @element:底部触碰到该对象时停止
         * @offset:距离element多远时停止 默认0
         */
        var un = options.until;
        if (!un || !un.element || !un.element.length) {
            options.until = null;
        } else {
            un.offset = un.offset || 0;
            un.top = un.element.offset().top - un.offset;
            //until.element的位置可能会不断发生变化，所以需要在scroll事件中更新
            un.bottom = height;
        }
        //添加一个占位元素
        if (!options.Float) {
            options.holder = $('<div class="nj_fix_holder"></div>').insertBefore(element);
            options.holderStyle = {
                width: "1px",
                height: height
            };
        }
        fixed.item.push(options);
        fixed.scroll();
    };
    fixed.item = [];
    fixed.scroll = function() {
        var _top, un, top, i, n, options;
        for (i = 0, n = fixed.item.length; i < n; i++) {
            options = fixed.item[i];
            _top = options.wrap.scrollTop();
            un = options.until;
            top = options.top;
            if (_top > top - options.offset) {
                if (!options.state && options.holder) {
                    //更新holderStyle 页面布局变化会影响element高度
                    options.holderStyle.height = options.element.outerHeight(true);
                    options.holder.css(options.holderStyle);
                }
                if (un) {
                    un.top = un.element.offset().top - un.offset;
                    if (un.bottom + options.offset + _top >= un.top) {
                        options.state = 2;
                        options.element.css({
                            position: "absolute",
                            top: un.top - un.bottom
                        });
                        continue;
                    } else if (options.state == 2) {
                        options.element.attr("style", options.style);
                    }
                }
                if (options.state != 1) {
                    options.element.css({
                        top: ie6 ? options.offset + _top : options.offset,
                        position: ie6 ? "absolute" : "fixed",
                        width: options.element.parent().width()
                    }).addClass("nj_fixed");
                    options.state = 1;
                    options.start && options.start();
                }
            } else if (options.state) {
                options.state = 0;
                options.element.attr("style", options.style).removeClass("nj_fixed");
                options.holder && options.holder.removeAttr("style");
                options.end && options.end();
            }
            options.callback && options.callback();
        }
    };
    fixed.bind = function(options) {
        fixed.init = 1;
        options.wrap.on("scroll.nj_fixed", fixed.scroll);
    };
    fixed.reset = function(wrap) {
        fixed.item = [];
        fixed.init = null;
        wrap.off("scroll.nj_fixed");
    };
    return fixed;
});
