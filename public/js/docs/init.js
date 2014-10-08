noJS.css([ domain.rs + "/css/nojs/tree.css", domain.rs + "/css/nojs/select.css", domain.rs + "/css/nojs/codelight.css" ]);

define("docs/init", [ "lib/jquery/jquery", "./index", "lib/nojs/ui", "./menu", "./url", "lib/nojs/mods/tree", "$", "./key", "../lib/nojs/mods/codelight", "lib/nojs/mods/layer", "ui", "./demo" ], function(require) {
    var $ = require("lib/jquery/jquery"), docs = require("./index"), codeLight = require("../lib/nojs/mods/codelight"), layer = require("lib/nojs/mods/layer"), demo = require("./demo");
    docs.init({
        menu: domain.rs + "/src/docs/config.json",
        defaultNode: "nojs_info",
        beforeSend: function() {
            //docs.$content.fadeTo(200, 0);
            window.demoAction = null;
        },
        complete: function() {
            //docs.$content.stop().fadeTo(400, 1);
            new codeLight({
                parent: docs.$wrap
            });
            operat.hide();
        }
    });
    var $operat = $("#operating .inner_btn"), operat = new layer.overlay({
        position: {
            right: 0
        }
    });
    operat.set("content", $("#op_menu").show());
    operat.on({
        mode: "click",
        element: $operat
    });
    operat.content.find(".demo").click(function() {
        operat.hide();
        demo.show();
    });
});

/*
 * 主界面框架入口文件
 * 
 */
define("docs/index", [ "lib/jquery/jquery", "lib/nojs/ui", "docs/menu", "docs/url", "lib/nojs/mods/tree", "$", "docs/key" ], function(require) {
    var $ = require("lib/jquery/jquery"), ui = require("lib/nojs/ui"), G = {}, menu = require("docs/menu"), url = require("docs/url"), setUrl = url.setUrl, key = require("docs/key"), html = $("html");
    //全屏快捷键"F"    
    key.methods["70"] = function() {
        setUrl("full", setUrl("full") ? null : 1);
    };
    url.onHashChange.push(function(e, data) {
        var key = data.key;
        if (key == "full") {
            html[setUrl(key) == "1" ? "addClass" : "removeClass"]("page_full");
        } else if (key == "hideMenu") {
            html[setUrl(key) ? "addClass" : "removeClass"]("hide_menu");
        }
    });
    //初始状态
    setUrl("full") == "1" && html.addClass("page_full");
    if (setUrl("hideMenu") == "1" || ui.mobile) {
        setUrl("hideMenu", 1);
        html.addClass("hide_menu");
    }
    G = {
        $wrap: $("#main_content"),
        $content: $("#iframe_content"),
        beforeSend: function() {
            //beforeSend事件
            G.options.beforeSend && G.options.beforeSend();
        },
        complete: function(data) {
            G.data = data;
            ui.mobile && setUrl("hideMenu", 1);
            //complete事件
            G.options.complete && G.options.complete();
        },
        menu: menu
    };
    ui.config({
        overlay: {
            insertTo: G.$content
        }
    });
    //框架内跳转链接
    G.jump = function(url) {
        setUrl("url", url);
    };
    G.$wrap.click(function(e) {
        var t = e.target, id, act;
        if (t.tagName.toLowerCase() == "a") {
            act = $(t).attr("data-act");
            if (act == "jump") {
                //页面内链接跳转
                G.jump($(t).attr("href"));
                return false;
            }
            id = $(t).attr("data-treeid");
            var n = menu.items.length, m;
            if (id && n) {
                for (var i = 0; i < n; i++) {
                    m = menu.items[i];
                    if (m.data.all[id]) {
                        m.select(id);
                        break;
                    }
                }
                return false;
            }
        }
    }).delegate('[data-act="jumps"] a', "click", function(e) {
        G.jump($(e.target).attr("href"));
        return false;
    });
    $("#ui_page").show();
    G.init = function(options) {
        G.options = options || {};
        menu.init(G);
    };
    return G;
    ui.touch(function() {
        G.$wrap.swipeRight(function() {
            setMenu("show");
        }).swipeLeft(function() {
            setMenu("hide");
        });
    });
});

/*
 * 侧栏导航菜单
 */
define("docs/menu", [ "lib/jquery/jquery", "lib/nojs/ui", "docs/url", "lib/nojs/mods/tree", "$" ], function(require) {
    var $ = require("lib/jquery/jquery"), ui = require("lib/nojs/ui"), url = require("docs/url"), tree = require("lib/nojs/mods/tree"), side = $("#side_menu"), setUrl = url.setUrl, first = 0, menu = {
        items: []
    }, G;
    url.onHashChange.push(function(e, data) {
        var id = data.id, m, key = data.key;
        if (id && (key == "id" || key == "url") && menu.items.length) {
            for (var i = 0; i < menu.items.length; i++) {
                m = menu.items[i];
                if (m.data.all[id]) {
                    first = 2;
                    m.select(id);
                    first = 1;
                    break;
                }
            }
        }
    });
    var treeOptions = {
        //defaultNode : 'nojs_info',
        onSelect: function(data) {
            if (!first && setUrl()) {
                //页面首次加载
                treeSelect.call(this, data);
                first = 1;
                return;
            }
            if (first == 2) {
                //onhashchange
                treeSelect.call(this, data);
            } else {
                var _data = {
                    id: data.id
                };
                if (first) {
                    //tree click 通过hash变化来触发onSelect事件
                    _data["url"] = null;
                }
                setUrl(_data);
                first = 1;
            }
        }
    };
    /*
     * #url直接加载url指定地址
     * id和url同时出现时 id高亮 url为真实页面 可用于url是id下的子页面
     */
    function treeSelect(data) {
        var link = data.link, id = data.id;
        if (!link) {
            return;
        }
        var _url = setUrl("url");
        var _id = this.box[0].id, name = _id.substring(_id.indexOf("_") + 1, _id.length), url = _url || "/docs/" + this.box.data("id") + "/" + link, title = document.title, _data = {
            title: data.name,
            url: url
        };
        title = title.indexOf(" - ") > -1 ? title.split(" - ")[1] : title;
        G.beforeSend && G.beforeSend(_data);
        document.title = data.name + " - " + title;
        this.box.siblings(".nj_tree").find("a.current").removeClass("current");
        menu.load(_data);
        //记录最后访问的节点
        $.localStorage.set("lastNode", id);
    }
    menu.load = function(data) {
        data = data || G.data;
        $.ajax({
            url: data.url,
            type: "get",
            dataType: "html",
            headers: {
                noAjax: true
            },
            success: function(html) {
                G.$content.html(html);
                G.complete && G.complete(data);
            }
        });
    };
    function treeInit() {
        var menu = G.options.menu;
        typeof menu == "string" ? $.getJSON(menu, call) : call(menu);
        function call(json) {
            for (var i in json) {
                createProject(i, json[i]);
            }
        }
    }
    function createProject(name, p) {
        var data = p.data, _tree, id;
        if (p.disable == "true" || !data) {
            return;
        }
        id = "menu_" + name;
        _tree = $('<div id="' + id + '" class="nj_tree"></div>');
        side.append(_tree);
        _tree.data("id", name);
        var t = new tree(id, {
            data: data,
            onSelect: treeOptions.onSelect,
            defaultNode: treeOptions.defaultNode
        });
        menu.items.push(t);
    }
    menu.init = function(global) {
        G = global;
        treeOptions.defaultNode = setUrl() || G.options.defaultNode;
        //设置默认节点
        treeInit();
    };
    return menu;
});

define("docs/url", [ "lib/jquery/jquery" ], function(require) {
    var $ = require("lib/jquery/jquery"), data = {}, ieHashSupport = $.browser("ie") && $.browser.version < 8;
    if (ieHashSupport) {
        var iframe = $('<iframe id="hashIframe" name="hashIframe" style="display:none;position:absolute"></iframe><a target="hashIframe"></a>').appendTo(document.body), Iframe, hashLink = iframe[1];
        Iframe = iframe[0].contentWindow;
        iframe = Iframe.document;
        iframe.open();
        iframe.write('<a href="" style="display:block;width:100px;height:500px"></a>');
        iframe.close();
        iframe = $(iframe.body);
        iframe.css({
            height: "1px",
            overflow: "scroll"
        });
    }
    data.onHashChange = [];
    function setUrl(key, value) {
        //@value: null清空参数undefined获取参数值 否则设置参数值
        var hash = location.hash.replace(/^#/, "").split("&"), i, m, _hash = {}, group = $.type(key) == "object";
        key = key || "id";
        for (i = 0; i < hash.length; i++) {
            if (!hash[i]) {
                continue;
            }
            m = hash[i].split("=");
            _hash[m[0]] = m[1];
        }
        if (group) {
            setUrl.group($.extend({}, _hash, key));
            return;
        }
        //没有改变
        if (value == _hash[key]) {
            return _hash[key];
        }
        if (value === null) {
            //delete
            delete _hash[key];
        } else if (value === undefined) {
            //get
            _hash[key] = _hash[key] && decodeURIComponent(_hash[key]);
            return _hash[key] && decodeURIComponent(_hash[key]);
        } else {
            //set
            _hash[key] = value && encodeURIComponent(value);
            _hash[key] = encodeURIComponent(_hash[key]);
        }
        hash = [];
        for (i in _hash) {
            hash.push(i + "=" + _hash[i]);
        }
        setUrl.call && setUrl.call();
        goHash(hash.join("&"));
    }
    /*
	 * 批量处理多个key/value
	 */
    setUrl.group = function(data) {
        var hash = [];
        for (var i in data) {
            data[i] && hash.push(i + "=" + data[i]);
        }
        hash = hash.join("&");
        //没有改变
        if ("#" + hash == location.hash) {
            return;
        }
        setUrl.call && setUrl.call();
        goHash(hash);
    };
    function goHash(hash) {
        if (ieHashSupport) {
            if (!Iframe.document.getElementById(hash)) {
                iframe.append('<a id="' + hash + '" style="display:block;width:1px;height:1px"></a>');
            }
            hashLink.href = "#" + hash;
            hashLink.click();
        }
        location.hash = hash;
    }
    data.setUrl = setUrl;
    function getChange(e) {
        var newHash = getChange.hash(e.newURL), oldHash = getChange.hash(e.oldURL), key, i;
        for (i in newHash) {
            if (newHash[i] != oldHash[i]) {
                key = i;
                break;
            }
        }
        if (!key) {
            for (i in oldHash) {
                if (newHash[i] != oldHash[i]) {
                    key = i;
                    break;
                }
            }
        }
        return key;
    }
    getChange.hash = function(url) {
        var hash, rect = {}, i = 0, m;
        if (!url) {
            return rect;
        }
        hash = url.split("#")[1];
        if (hash) {
            hash = hash.split("&");
        } else {
            hash = [];
        }
        for (;i < hash.length; i++) {
            m = hash[i].split("=");
            rect[m[0]] = m[1];
        }
        return rect;
    };
    data.getChange = getChange;
    if (typeof onhashchange != "undefined") {
        var i, n, _data, event = data.onHashChange, oldUrl = location.href, Hashchange = function(e) {
            e = e || window.event;
            //console.log(e.oldURL,oldUrl)
            //for ie
            e.oldURL = e.oldURL || oldUrl;
            e.newURL = e.newURL || location.href;
            oldUrl = e.newURL;
            //console.log(e.newURL)
            n = event.length;
            _data = {};
            _data.id = setUrl();
            _data.key = getChange(e);
            for (i = 0; i < n; i++) {
                event[i](e, _data);
            }
        };
        if (ieHashSupport) {
            $(Iframe).on("scroll", function(e) {
                Hashchange(e);
            });
        } else {
            window.onhashchange = Hashchange;
        }
    }
    return data;
});

/*
 * 文档快捷键
 * nolure@vip.qq.com
 * 2014-4-1
 */
define("docs/key", [ "lib/jquery/jquery" ], function(require) {
    var $ = require("lib/jquery/jquery"), key = {};
    key.methods = {};
    $(document).keydown(function(e) {
        var code = e.keyCode, tag = e.target.tagName.toLowerCase();
        if (tag == "input" || tag == "textarea" || e.target.contentEditable == "true") {
            return;
        }
        //console.log(code)
        for (var i in key.methods) {
            if (i == code) {
                key.methods[i]();
            }
        }
    });
    return key;
});

/**
 * nolure@gmail.com
 * 2011-11-9
 * code light
 */
define("lib/nojs/mods/codelight", [ "lib/jquery/jquery" ], function(require) {
    var $ = require("lib/jquery/jquery"), codeLight = function(opt) {
        this.opt = opt = opt || {};
        this.parent = opt.parent || "body";
        this.box = null;
        this.code = [];
        this.init();
    };
    codeLight.prototype = {
        init: function() {
            var m, code, box, type, C = this.parent.find("script[code]"), s = /\s{4}/, item, first, last, key;
            //为每段代码设置特殊关键字
            if (!C.length) {
                return;
            }
            for (var i = 0; i < C.length; i++) {
                m = C.eq(i);
                type = m.attr("code");
                key = m.attr("key");
                if (key) {
                    key = key.split(",");
                }
                code = m.html() || m.val();
                if (code.replace(/\s/g, "") == "") {
                    continue;
                }
                code = this.str(code, type);
                code = setKey(key, code);
                m.css({
                    display: "none"
                }).after('<pre title="双击编辑" expand="' + (m.attr("expand") == 0 ? 0 : 1) + '" class="codelight_box"><ol class="rs_item" tabindex="-1">' + code + '</ol><p class="open">+code</p></pre>');
                box = m.next("pre");
                box.find(".rs_item").on("dblclick", function() {
                    if (box.hasClass("code_hide")) {
                        return false;
                    }
                    $(this).attr({
                        contentEditable: true
                    }).addClass("edit");
                }).on("blur", function() {
                    $(this).removeAttr("contentEditable").removeClass("edit");
                });
                box.find(".note .key").removeClass("key");
                //去掉注释内的自定义关键字
                this.code.push(box);
                delLine(box);
                item = box.find(".rs_item li");
                delTab(item);
                this.setOpt(box);
                m.remove();
            }
            function delLine(box) {
                //去掉首尾空行
                item = box.find(".rs_item li");
                first = item.first();
                last = item.last();
                if (first.html().replace(/\s/g, "") == "") {
                    first.remove();
                }
                if (last.html().replace(/\s/g, "") == "") {
                    last.remove();
                }
                item = box.find(".rs_item li");
                if (item.first().html().replace(/\s/g, "") == "") {
                    delLine(box);
                }
            }
            function delTab(item) {
                //去除多余的整体tab缩进
                first = item.first();
                if (s.test(first.html())) {
                    var m, i, n = item.length;
                    for (i = 0; i < n; i++) {
                        m = item.eq(i);
                        m.html(m.html().replace(s, ""));
                    }
                    if (s.test(first.html())) {
                        delTab(item);
                    }
                }
            }
            function setKey(key, code) {
                //自定义关键字高亮
                if (!key || !key.length) {
                    return code;
                }
                for (var j = 0; j < key.length; j++) {
                    code = code.replace(eval("/(" + key[j] + ")/g"), '<b class="key">$1</b>');
                }
                return code;
            }
        },
        str: function(str, type) {
            var r = {
                L: /</g,
                G: />/g,
                L1: /(&lt;[\/]?)/g,
                G1: /&gt;/g,
                E: /\n/g,
                tab: /\t/g,
                //html 属性，标签，注释
                htmlProperty: /(class|style|id|title|alt|src|align|href|rel|rev|name|target|content|http-equiv|onclick|onchange|onfocus|onmouseover|onmouseout|type|for|action|value)=/g,
                htmlTag: /(&lt;[\/]?)(html|body|title|head|meta|link|script|base|style|object|iframe|h1|h2|h3|h4|h5|h6|p|blockquote|pre|address|img|a|ol|div|ul|li|dl|dd|dt|ins|del|cite|q|fieldset|form|label|legend|input|button|select|textarea|table|caption|tbody|tfoot|thead|tr|td|th|span|strong|em|i|b|option)(\s|&gt;)/g,
                htmlNote: /(&lt;\!--([\s\S]*?)--&gt;)/gm,
                //html注释
                //js
                jsKey: /(var|new|function|return|this|if|else|do|while|for|true|false)([\s\({;.]+)/g,
                jsNote: /(\/\/.*)[\r\n]/g,
                //单行注释
                jsNoteP: /(\/\*([\s\S]*?)\*\/)/gm,
                //多行注释
                S: /&/g
            };
            str = str.replace(/<\/\sscript>/g, "</script>");
            str = str.replace(r.S, "&amp;");
            //替换&特殊字符
            //替换所有<>标签
            str = str.replace(r.L, "&lt;").replace(r.G, "&gt;");
            //添加高亮标签
            if (type == "html") {
                str = str.replace(r.htmlProperty, '<i class="property">$1</i>=');
                //属性
                str = str.replace(r.htmlTag, '$1<i class="tag">$2</i>$3');
                //html标签
                str = str.replace(r.htmlNote, '<i class="note">$1</i>');
                //注释
                str = str.replace(r.L1, '<i class="lt">$1</i>').replace(r.G1, '<i class="lt">&gt;</i>');
            } else if (type == "javascript") {
                str = str.replace(/('[^'\\]*(?:\\[\s\S][^'\\]*)*'|"[^"\\]*(?:\\[\s\S][^"\\]*)*")/g, '<i class="note">$1</i>');
                //引号之间的内容	
                str = str.replace(r.jsKey, '<i class="jskey">$1</i>$2');
                //关键字
                str = str.replace(r.jsNote, '<i class="note">$1</i></li><li>').replace(r.jsNoteP, '<i class="note">$1</i>');
            }
            //处理制表符 ，每个制表符统一成4个空白符
            str = str.replace(r.tab, "    ");
            //在换行符处添加li标签,
            str = "<li>" + str.replace(r.E, "</li><li>");
            str += "</li>";
            return str;
        },
        setOpt: function(box) {
            var T = this, opt = '<div class="set_opt">', hide;
            opt += '<a href="" class="hide">折叠</a>';
            opt += "</div>";
            box.append(opt);
            opt = box.find(".set_opt");
            hide = opt.find(".hide");
            box.mouseover(function() {
                opt.show();
            }).mouseout(function() {
                opt.hide();
            }).click(function(e) {
                var t = $(e.target);
                if (t.hasClass("open")) {
                    hide.click();
                }
            });
            hide.click(function() {
                var m = $(this);
                if (box.hasClass("code_hide")) {
                    box.removeClass("code_hide").find(".open").hide();
                    m.html("折叠");
                } else {
                    box.addClass("code_hide").find(".open").show();
                    m.html("展开");
                }
                return false;
            });
            if (this.opt.autoHide || box.attr("expand") == 0) {
                hide.click();
            }
        },
        select: function(index) {
            var code = this.code[index || 0].find(".rs_item"), range;
            code.dblclick().focus().select();
            if (window.getSelection) {
                range = window.getSelection();
            } else if (document.selection && document.selection.createRange) {
                range = document.selection.createRange();
            }
            //console.log(code[0].selectionStart)
            return;
            range = document.body.createTextRange();
            range.moveEnd("character", -1);
            range.moveStart("character", 0);
            range.select();
        }
    };
    return codeLight;
});

define("docs/demo", [ "lib/jquery/jquery", "docs/index", "lib/nojs/ui", "docs/menu", "docs/url", "lib/nojs/mods/tree", "$", "docs/key" ], function(require) {
    var $ = require("lib/jquery/jquery"), docs = require("docs/index");
    var $demo;
    function demo() {
        $demo = $([ '<div id="demo_content" class=""><div class="d_wrap">', '<div class="d_close f_icon"></div>', '<div class="d_content"></div>', "</div></div>" ].join("")).appendTo(docs.$wrap);
        $demo.find("div.d_close").click(function() {
            demo.hide();
        });
        demo.$content = $demo.find("div.d_content");
    }
    demo.show = function() {
        if (!window.demoAction) {
            return;
        }
        !$demo && demo();
        docs.$wrap.addClass("demo_wrap");
        setTimeout(function() {
            $demo.addClass("d_open");
        }, 200);
        demo.render();
    };
    demo.hide = function() {
        docs.$wrap.removeClass("demo_wrap");
        $demo.removeClass("d_open");
    };
    demo.render = function() {
        var data = window.demoAction.item, html = {
            menu: "",
            content: ""
        }, i = 0, n = data.length;
        for (;i < n; i++) {
            html.menu += "<li>demo" + (i + 1) + "</li>";
            html.content += '<div class="nj_s_c">' + data[i].content + "</div>";
        }
        html.menu = '<ul class="nj_s_menu clearfix">' + html.menu + "</ul>";
        html.content = '<div class="nj_s_con">' + html.content + "</div>";
        demo.$content.html(html.menu + html.content);
        require.async("lib/nojs/mods/Switch", function(Switch) {
            new Switch.tab(demo.$content, {
                onChange: function(index) {
                    data[index].callback && data[index].callback();
                }
            });
        });
    };
    return demo;
});