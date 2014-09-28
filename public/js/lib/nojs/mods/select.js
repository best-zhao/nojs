/*
 * select ui
 */
define("lib/nojs/mods/select", [], function(require, $, ui) {
    ui.select = function(element, options) {
        var isNew;
        if (isNew = ui.instaceofFun(this, arguments)) {
            return isNew;
        }
        /*
         * 下拉列表
         * @element: selectd对象或id
         * @options:可选项{max:最多显示选项数,至少大于1,onSelect:当选择某项的时候触发一个回调}
         */
        //options = $.extend( ui.config.select, options );        
        options = options || {};
        if (!(options.nearby = ui.dom(element))) {
            return;
        }
        options.className = "nj_select_list " + (options.className || "");
        options.hoverClass = options.hoverClass || "nj_select_show";
        ui.select.baseConstructor.call(this, options);
        if (!this.nearby || this.nearby[0].tagName.toLowerCase() != "select") {
            return;
        }
        this._select = this.nearby;
        this._value = this._select.val();
        ui.data(this.nearby[0].id, this);
        this.max = this.options.max;
        //最多
        this.onSelect = this.options.onSelect;
        //切换回调
        this.defaultEvent = this.options.defaultEvent == true ? true : false;
        //首次是否执行回调
        this.autoWidth = this.options.autoWidth == false ? false : true;
        this.index = 0;
        this.value = this.nearby[0].getAttribute("value") || this.nearby.val();
        this.replace();
    };
    ui.extend(ui.select, ui.overlay);
    ui.extend.proto(ui.select, {
        destroy: function(fn, object) {
            this.nearby.replaceWith(this._select);
            this.nearby.remove();
            fn.call(this, object);
        }
    });
    ui.select.prototype.replace = function(I) {
        var list = this.nearby.find("option"), group = this.nearby.find("optgroup"), HTML, _nearby;
        if (group.length) {
            //分组
            var i, m;
            for (i = 0; i < group.length; i++) {
                m = group.eq(i);
                m.before("<dt>" + m.attr("label") + "</dt>").replaceWith(m.html());
            }
        }
        HTML = $("<dl>" + this.nearby.html().replace(/(<\/?)option(>?)/gi, "$1dd$2") + "</dl>");
        group.length && HTML.addClass("group");
        this.length = list.length;
        _nearby = $([ '<span class="nj_select" tabindex="-1"><i class="nj_s_wrap"></i><div class="nj_arrow"></div>', '<input type="hidden" name="' + this.nearby.attr("name") + '" value="' + this.value + '" class="hide" />', "</span>" ].join(""));
        this.nearby.replaceWith(_nearby);
        this.nearby = _nearby;
        this.set("content", HTML);
        this.current = this.nearby.find("i");
        this.hidden = this.nearby.find("input.hide");
        this.item = this.element.find("dd");
        var maxH = "auto";
        if (this.max && /^\d+$/.test(this.max) && this.max > 1) {
            //显示固定个数
            if (this.max < this.length) {
                m = this.item.last();
                maxH = m.outerHeight() * this.max;
                if (group.length) {
                    maxH += this.item.eq(this.max - 1).prevAll("dt").length * m.siblings("dt").outerHeight();
                }
                HTML.height(maxH);
            }
        }
        !I && this.bindEvent();
        //设置默认选项
        !this.select(this.value, this.defaultEvent) && this.select(0, this.defaultEvent);
        //没找到默认第一项
        var w1 = this.nearby.width(), w2 = this.element.width();
        if (this.autoWidth) {
            if (w1 > w2) {
                this.element.width(w1);
                w2 = w1;
            }
            this.nearby.width(w2);
        }
    };
    ui.select.prototype.bindEvent = function() {
        var self = this;
        this.on({
            mode: this.options.mode
        });
        this.element.click(function(e) {
            var t = e.target, v = t.getAttribute("value");
            if (t.tagName.toLowerCase() == "dd") {
                self.select(self.item.index(t));
                self.nearby.focus();
                self.hide();
            }
        });
        this.nearby.keydown(function(e) {
            //键盘上下选择 回车选中
            if (e.which == 38) {
                self.index--;
            } else if (e.which == 40) {
                self.index++;
            } else if (e.which == 13) {
                self.hide();
            } else {
                return false;
            }
            self.select(self.index);
            return false;
        });
    };
    ui.select.prototype.select = function(value, trigger) {
        var current, m, i, val;
        if (typeof value == "string") {
            //通过value值匹配
            val = this.content.find('dd[value="' + value + '"]');
            if (val.length) {
                current = val.first();
                this.index = this.item.index(current);
            } else {
                for (i = 0; i < this.length; i++) {
                    m = this.item.eq(i);
                    if (m.text() == value) {
                        current = m;
                        this.index = i;
                        break;
                    }
                }
            }
        } else if (typeof value == "number") {
            //通过索引值匹配
            value = value < 0 ? this.length - 1 : value;
            value = value > this.length - 1 ? 0 : value;
            this.index = value;
            current = this.item.eq(value);
            value = current.attr("value") || "";
        }
        if (!current) {
            return;
        }
        this.current.text(current.text());
        current.addClass("select").siblings().removeClass("select");
        this.hidden.val(value);
        this.value = value;
        //为其添加事件
        trigger !== false && this.onSelect && this.onSelect.call(this, value);
        return current;
    };
    ui.select.prototype.reset = function() {
        this.select(this._value);
    };
    return ui.select;
});
