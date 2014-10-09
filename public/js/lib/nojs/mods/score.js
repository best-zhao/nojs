/*
 * 打分组件
 * nolure@vip.qq.com
 * 2013-11-7
 */
define("lib/nojs/mods/score", [ "lib/jquery/jquery" ], function(require, $) {
    var $ = require("lib/jquery/jquery");
    function score(id, options) {
        this.options = options = options || {};
        this.element = typeof id == "string" ? $("#" + id) : id;
        this.level = options.level || 5;
        //评分等级 默认5
        this.index = options.index || 0;
        this.title = options.title instanceof Array && options.title.length >= this.level ? options.title : null;
        this.field = this.element.find("input:hidden");
        this.item = null;
        this.init();
    }
    score.prototype = {
        init: function() {
            var self = this, i, html = "", width;
            for (i = 0; i < this.level; i++) {
                html += '<i title="' + (this.title ? this.title[i] : i + 1 + "分") + '"></i>';
            }
            this.element.prepend(html);
            this.item = this.element.children("i");
            width = this.item.width();
            this.element.width(this.level * width);
            this.item.each(function(i) {
                $(this).css({
                    width: width * (i + 1),
                    "z-index": self.level - i
                });
            });
            this.bind();
        },
        bind: function() {
            var self = this;
            this.item.hover(function() {
                var t = $(this), now = self.element.find("i.current"), index = t.index();
                t.addClass("hover").siblings().removeClass("hover");
                if (index > now.index()) {
                    now.addClass("hover");
                }
                self.options.onMove && self.options.onMove.call(self, true, index + 1);
            }, function() {
                self.item.removeClass("hover");
                self.options.onMove && self.options.onMove.call(self, false, $(this).index() + 1);
            });
            this.element.click(function(e) {
                var t = e.target;
                if (t.tagName.toLowerCase() == "i") {
                    self.item.removeClass("current hover");
                    $(t).addClass("current");
                    self.index = $(t).index() + 1;
                    self.field.val(self.index);
                    self.options.onSelect && self.options.onSelect.call(this, self.index);
                }
            });
            this.index && this.item.eq(this.index - 1).click().mouseout();
        },
        reset: function() {
            this.field.val("");
            this.item.removeClass("current");
            this.index = 0;
            this.options.onMove && this.options.onMove.call(this);
        }
    };
    return score;
});
