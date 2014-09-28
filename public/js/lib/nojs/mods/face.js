/*
 * 公用组件：表情
 * 2013-8-2
 * nolure@vip.qq.com
 */
define("lib/nojs/mods/face", [ "./Switch", "lib/jquery/jquery", "lib/nojs/ui" ], function(require, $, ui) {
    require("./Switch");
    var face = function(options) {
        this.options = options = $.extend(true, {}, face._config, options);
        this.button = options.button;
        //表情选择器,JQ对象
        this.insert = $(options.insert);
        //表情写入对象
        if (!this.button) {
            return;
        }
        this.themes = [];
        this.pop = null;
        //表情显示容器
        this.item = null;
        this.init();
    };
    face._config = {
        themeItems: {
            //表情主题配置http://cache.soso.com/img/img/e200.gif
            "default": {
                name: "默认表情",
                url: "/",
                item: {
                    "0": "微笑",
                    "1": "撇嘴",
                    "2": "色",
                    "3": "发呆",
                    "4": "得意",
                    "5": "流泪",
                    "6": "害羞",
                    "7": "闭嘴",
                    "8": "睡",
                    "9": "大哭",
                    "10": "尴尬",
                    "11": "发怒",
                    "12": "调皮",
                    "13": "龇牙",
                    "14": "惊讶",
                    "15": "难过",
                    "16": "酷",
                    "17": "冷汗",
                    "18": "抓狂",
                    "19": "吐",
                    "20": "偷笑",
                    "21": "可爱",
                    "22": "白眼",
                    "23": "傲慢",
                    "24": "饥饿",
                    "25": "困",
                    "26": "惊恐",
                    "27": "流汗",
                    "28": "憨笑",
                    "29": "大兵",
                    "30": "奋斗",
                    "31": "咒骂",
                    "32": "疑问",
                    "33": "嘘",
                    "34": "晕",
                    "35": "折磨",
                    "36": "衰",
                    "37": "骷髅",
                    "38": "敲打",
                    "39": "再见",
                    "40": "擦汗",
                    "41": "抠鼻",
                    "42": "鼓掌",
                    "43": "糗大了",
                    "44": "坏笑",
                    "45": "左哼哼",
                    "46": "右哼哼",
                    "47": "哈欠",
                    "48": "鄙视",
                    "49": "委屈",
                    "50": "快哭了",
                    "51": "阴险",
                    "52": "亲亲",
                    "53": "吓",
                    "54": "可怜"
                },
                fix: ".gif"
            },
            qq: {
                name: "默认表情",
                url: "/",
                item: {
                    e100: "微笑",
                    e101: "撇嘴",
                    e102: "色",
                    e103: "发呆",
                    e104: "得意",
                    e105: "流泪",
                    e106: "害羞",
                    e107: "闭嘴",
                    e108: "睡",
                    e109: "大哭",
                    e110: "尴尬",
                    e111: "发怒",
                    e112: "调皮",
                    e113: "龇牙",
                    e114: "惊讶",
                    e115: "难过",
                    e116: "酷",
                    e117: "冷汗",
                    e118: "抓狂",
                    e119: "吐",
                    e120: "偷笑",
                    e121: "可爱",
                    e122: "白眼",
                    e123: "傲慢",
                    e124: "饥饿",
                    e125: "困",
                    e126: "惊恐",
                    e127: "流汗",
                    e128: "憨笑",
                    e129: "大兵",
                    e130: "奋斗",
                    e131: "咒骂",
                    e132: "疑问",
                    e133: "嘘",
                    e134: "晕",
                    e135: "折磨",
                    e136: "衰",
                    e137: "骷髅",
                    e138: "敲打",
                    e139: "再见",
                    e140: "擦汗",
                    e141: "抠鼻",
                    e142: "鼓掌",
                    e143: "糗大了",
                    e144: "坏笑",
                    e145: "左哼哼",
                    e146: "右哼哼",
                    e147: "哈欠",
                    e148: "鄙视",
                    e149: "委屈",
                    e150: "快哭了",
                    e151: "阴险",
                    e152: "亲亲",
                    e153: "吓",
                    e154: "可怜",
                    e155: "菜刀",
                    e156: "西瓜",
                    e157: "啤酒",
                    e158: "篮球",
                    e159: "乒乓",
                    e160: "咖啡",
                    e161: "饭",
                    e162: "猪头",
                    e163: "玫瑰",
                    e164: "凋谢",
                    e165: "示爱",
                    e166: "爱心",
                    e167: "心碎",
                    e168: "蛋糕",
                    e169: "闪电",
                    e170: "炸弹",
                    e171: "刀",
                    e172: "足球",
                    e173: "瓢虫",
                    e174: "便便",
                    e175: "月亮",
                    e176: "太阳",
                    e177: "礼物",
                    e178: "拥抱",
                    e179: "强",
                    e180: "弱",
                    e181: "握手",
                    e182: "胜利",
                    e183: "抱拳",
                    e184: "勾引",
                    e185: "拳头",
                    e186: "差劲",
                    e187: "爱你",
                    e188: "NO",
                    e189: "OK",
                    e190: "爱情",
                    e191: "飞吻",
                    e192: "跳跳",
                    e193: "发抖",
                    e194: "怄火",
                    e195: "转圈",
                    e196: "磕头",
                    e197: "回头",
                    e198: "跳绳",
                    e199: "挥手",
                    e200: "激动"
                },
                fix: ".gif"
            }
        }
    };
    face.config = function(options) {
        return $.extend(true, face._config, options);
    };
    face.prototype = {
        init: function() {
            var T = this;
            var options = $.extend({
                nearby: this.button,
                className: "face_menu",
                onShow: function() {
                    if (!this.element.data("init")) {
                        this.element.data("init", true);
                        T.loadFace();
                    }
                }
            }, this.options.overlay);
            this.pop = new ui.overlay(options);
            this.pop.on({
                mode: "click"
            });
            //theme为数组显示多套表情
            var themes = this.options.themes || [];
            themes = typeof themes == "string" ? [ themes ] : themes;
            $.each(themes, function(i, v) {
                var item = face._config.themeItems[v];
                if (item) {
                    item.id = v;
                    T.themes.push(item);
                }
            });
        },
        //载入表情 once
        loadFace: function() {
            var T = this, n = 0, faceMenu = "", faceCon = "";
            $.each(this.themes, function(i, v) {
                faceMenu += '<li class="nj_s_m">' + v.name + "</li>";
                faceCon += '<div class="nj_s_c"><ul class="list clearfix ' + v.id + '">';
                for (var j in v.item) {
                    faceCon += '<li><img src="' + v.url + j + v.fix + '" data-name="' + i + "_" + v.item[j] + '" title="' + v.item[j] + '" alt="" /></li>';
                }
                faceCon += "</ul></div>";
            });
            var faceHtml = [ '<div class="nj_face">', '<div class="con">', '<div class="tit"><ul class="nj_s_menu clearfix">' + faceMenu + "</ul></div>", '<div class="nj_s_con clearfix">' + faceCon + "</div>", "</div>", '<span class="a"><em>◆</em><i>◆</i></span>', "</div>" ].join("");
            this.pop.set("content", faceHtml);
            this.tab = new ui.tab(this.pop.content);
            this.item = this.pop.content.find("ul.list img");
            this.pop.element.click(function(e) {
                var t = e.target, text;
                if (t.tagName.toLowerCase() == "img") {
                    text = "[:" + $(t).attr("data-name") + "]";
                    T.insertTo(text);
                    T.pop.hide();
                }
            });
        },
        //将所选表情写入到目标对象
        insertTo: function(text) {
            //将表情插入到光标处
            var C = new insertOnCursor(this.insert);
            C.insertAtCaret(text);
            this.insert.focus();
            var data = {
                theme: this.themes[this.tab.index],
                text: text,
                content: this.replaceFace(text)
            };
            this.options.onInsert && this.options.onInsert.call(this, data);
        },
        //提取表情,不传默认为当前表情插入对象val
        replaceFace: function(con, themes) {
            if (!con) {
                var con = this.insert.val();
            }
            var T = this;
            themes = themes || this.themes;
            $.each(themes, function(index, v) {
                var faceArray = v.item, N, pic, item;
                for (var i in faceArray) {
                    item = faceArray[i];
                    N = index + "_" + item;
                    if (con.indexOf("[:" + N + "]") != -1) {
                        pic = '<img src="' + v.url + i + v.fix + '" alt="' + item + '" class="nj_face_image" title="' + item + '" />';
                        con = con.replace(eval("/\\[:" + N.replace("(", "\\(").replace(")", "\\)") + "\\]/g"), pic);
                    }
                }
            });
            return con;
        }
    };
    /*
	 * 在光标处插入内容
	 * @obj:支持光标插入的对象
	 */
    function insertOnCursor(obj) {
        if (!obj || !obj.length) {
            return;
        }
        this.textBox = obj;
        this.setCaret();
    }
    insertOnCursor.prototype = {
        //初始化对象以支持光标处插入内容    	
        setCaret: function() {
            if (!$.browser.msie) {
                return;
            }
            var T = this;
            T.textBox.on("click select keyup", function() {
                T.textBox[0].caretPos = document.selection.createRange().duplicate();
            });
        },
        //在当前对象光标处插入指定的内容  
        insertAtCaret: function(text) {
            if (!this.textBox || !this.textBox.length) {
                return;
            }
            var textObj = this.textBox[0];
            if (document.all && textObj.createTextRange && textObj.caretPos) {
                var caretPos = textObj.caretPos;
                caretPos.text = caretPos.text.charAt(caretPos.text.length - 1) == "" ? text + "" : text;
            } else if (textObj.setSelectionRange) {
                var rangeStart = textObj.selectionStart;
                var rangeEnd = textObj.selectionEnd;
                var tempStr1 = textObj.value.substring(0, rangeStart);
                var tempStr2 = textObj.value.substring(rangeEnd);
                textObj.value = tempStr1 + text + tempStr2;
                var len = text.length;
                textObj.setSelectionRange(rangeStart + len, rangeStart + len);
            } else {
                textObj.value += text;
            }
        },
        //清除当前选择内容
        unselectContents: function() {
            if (window.getSelection) {
                window.getSelection().removeAllRanges();
            } else if (document.selection) {
                document.selection.empty();
            }
        },
        //选中内容  
        selectContents: function() {
            this.textBox.each(function(i) {
                var node = this;
                var selection, range, doc, win;
                if ((doc = node.ownerDocument) && (win = doc.defaultView) && typeof win.getSelection != "undefined" && typeof doc.createRange != "undefined" && (selection = window.getSelection()) && typeof selection.removeAllRanges != "undefined") {
                    range = doc.createRange();
                    range.selectNode(node);
                    if (i == 0) {
                        selection.removeAllRanges();
                    }
                    selection.addRange(range);
                } else if (document.body && typeof document.body.createTextRange != "undefined" && (range = document.body.createTextRange())) {
                    range.moveToElementText(node);
                    range.select();
                }
            });
        }
    };
    return face;
});

/*
 * tab side
 * nolure@vip.qq.com
 */
define("lib/nojs/mods/Switch", [ "lib/jquery/jquery", "lib/nojs/ui" ], function(require) {
    /*
     * switch原型超类|幻灯片、选项卡等
     */
    var $ = require("lib/jquery/jquery"), ui = require("lib/nojs/ui");
    function Tab(element, options) {
        var isNew;
        if (!(this instanceof Tab)) {
            return new Tab(element, options);
        }
        if (!(this.element = ui.dom(element))) {
            return;
        }
        this.menu = this.element.find(".nj_s_menu").first();
        this.menuItem = this.menu.find(".nj_s_m");
        this.wrap = this.element.find(".nj_s_con").first();
        this.item = this.wrap.children(".nj_s_c");
        this.length = this.item.length;
        if (!this.length) {
            return;
        }
        this.options = options = options || {};
        this.mode = this.mode || ui.config.eventType;
        this.onChange = options.onChange;
        this.onHide = options.onHide;
        this.index = this.getIndex(options.firstIndex);
        this.rule = options.rule || this.rule;
        this.options.start = this.options.start === false ? false : true;
        this.bind();
    }
    Tab.prototype = {
        bind: function() {
            var self = this, A, m, delay = this.mode == "mouseover" ? 100 : 0;
            //延迟触发
            if (!this.menuItem) {
                return;
            }
            this.menuItem.on(this.mode + ".nj_switch", function() {
                m = $(this);
                if (m.hasClass("current")) {
                    return false;
                }
                self.onTrigger && self.onTrigger();
                A = setTimeout(function() {
                    self.change(self.menuItem.index(m));
                }, delay);
                return false;
            }).mouseout(function() {
                A = clearTimeout(A);
            });
            this.options.start && this.change(this.index);
        },
        getIndex: function(index) {
            index = parseInt(index) || 0;
            index = index > this.length - 1 ? 0 : index;
            index = index < 0 ? this.length - 1 : index;
            return index;
        },
        change: function(index) {
            index = this.getIndex(index);
            if (this.rule) {
                if (this.rule.call(this, index) === false) {
                    return false;
                }
            } else {
                this.item.eq(index).show().siblings().hide();
                this.menuItem.eq(index).addClass("current").siblings().removeClass("current");
            }
            this.onHide && this.index != index && this.onHide.call(this, this.index);
            this.index = index;
            this.onChange && this.onChange.call(this, index);
        }
    };
    /*
     * slide幻灯片 继承至Tab
     */
    function Slide(element, options) {
        Slide.baseConstructor.call(this, element, options);
        if (!this.element) {
            return;
        }
        this.play = null;
        this.time = this.options.time || 5e3;
        this.auto = this.options.auto === false ? false : true;
        this.stopOnHover = this.options.stopOnHover === false ? false : true;
        var self = this;
        this.stopOnHover && this.element.hover(function() {
            self.play = clearInterval(self.play);
        }, function() {
            self.start();
        });
        this.getNum();
        this.options.start && this.start(true);
    }
    ui.extend(Slide, Tab);
    Slide.prototype.getNum = function() {
        if (this.menu.children().length) {
            return;
        }
        var list = "";
        for (var i = 1; i <= this.length; i++) {
            list += '<li class="nj_s_m">' + i + "</li>";
        }
        this.mene.append(list);
        this.menuItem = this.menu.find(".nj_s_m");
        this.bind();
    };
    Slide.prototype.onTrigger = function() {
        //手动触发时要重新开始计时，避免时间重合
        !this.stopOnHover && this.start();
    };
    Slide.prototype.rule = function(index) {
        //切换规则        
        this.item.eq(index).fadeIn(400).siblings().hide();
        this.menuItem.eq(index).addClass("current").siblings().removeClass("current");
        this.index = index;
    };
    Slide.prototype.start = function(startNow) {
        //开始播放
        var self = this;
        if (!this.auto || this.length < 2) {
            return;
        }
        startNow && this.change(this.index);
        clearInterval(self.play);
        self.play = setInterval(function() {
            self.change(++self.index);
        }, self.time);
    };
    return {
        tab: Tab,
        slide: Slide
    };
});
