define("docs/demo", [ "lib/jquery/jquery", "./index", "lib/nojs/ui", "./menu", "./url", "../lib/nojs/mods/tree", "./key" ], function(require) {
    var $ = require("lib/jquery/jquery"), docs = require("./index");
    var $demo;
    function demo() {
        $demo = $([ '<div id="demo_content" class=""><div class="d_wrap">', '<div class="d_close f_icon"></div>', '<div class="d_content clearfix"></div>', "</div></div>" ].join("")).appendTo(docs.$wrap);
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
            html.menu += '<li class="nj_s_m">demo' + (i + 1) + "</li>";
            html.content += '<div class="nj_s_c">' + data[i].content + "</div>";
        }
        html.menu = '<ul class="nj_s_menu demo_tab clearfix">' + html.menu + "</ul>";
        html.content = '<div class="nj_s_con clearfix">' + html.content + "</div>";
        demo.$content.html((window.demoAction.html || "") + html.menu + html.content);
        require.async("lib/nojs/mods/Switch", function(Switch) {
            new Switch.tab(demo.$content, {
                onChange: function(index) {
                    data[index].callback && data[index].callback();
                }
            });
        });
    };
    demo.destroy = function() {
        $demo && demo.$content.empty();
        window.demoAction = null;
    };
    return demo;
});

/*
 * 主界面框架入口文件
 * 
 */
define("docs/index", [ "lib/jquery/jquery", "lib/nojs/ui", "docs/menu", "docs/url", "lib/nojs/mods/tree", "docs/key" ], function(require) {
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
define("docs/menu", [ "lib/jquery/jquery", "lib/nojs/ui", "docs/url", "lib/nojs/mods/tree" ], function(require) {
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
 * tree 树型菜单
 * 2013-8-3
 * nolure@vip.qq.com
 */
define("lib/nojs/mods/tree", [ "lib/jquery/jquery" ], function(require) {
    var $ = require("lib/jquery/jquery");
    function tree(box, options) {
        var date1 = +new Date();
        this.box = typeof box == "string" ? $("#" + box) : box;
        this.options = options = options || {};
        this._data = options.data;
        //原始数据
        //@data: string即为ajax获取数据
        this.ajaxMode = typeof this._data == "string";
        tree.key = $.extend({
            id: "id",
            name: "name",
            parent: "parent",
            children: "children",
            open: "open",
            link: "link"
        }, tree.key);
        //直接导入格式化后的数据，需将所有节点状态置为1
        var fd = options.formatData, hasFormatData = $.type(fd) == "object" && $.type(fd.all) == "object" && $.type(fd.level) == "array";
        if (options.formatData) {
            !function() {
                var all = fd.all, level = fd.level, n = level.length, i, j, m;
                for (i in all) {
                    all[i].init = 1;
                }
                for (i = 0; i < n; i++) {
                    m = level[i];
                    for (j = 0; j < m.length; j++) {
                        m[j].init = 1;
                    }
                }
            }();
        }
        this.data = hasFormatData ? fd : this.ajaxMode ? null : tree.format(this._data);
        if (!this.box.length || !this.ajaxMode && !this.data.level.length) {
            return;
        }
        this.max = options.max || tree.max;
        /*
		 * checkbox
		 * @isCheck : true显示
		 * @radio : 单选
		 * @relationChildren : 选择父节点时是否全选其子节点
		 * @relationParent : 选择子节点关联父节点
		 */
        this.relationChildren = this.options.relationChildren == false ? false : true;
        this.relationParent = this.options.relationParent == false ? false : true;
        this.radio = this.options.radio;
        //ajax模式获取数据后，所有节点都应先初始化为包含子节点的节点
        if (this.ajaxMode) {
            var T = this;
            this.data ? this.init(null, true, true) : tree.ajax({
                url: this._data,
                tree: this,
                success: function(data) {
                    T.init(null, true, true);
                    T.options.ajaxSuccess && T.options.ajaxSuccess.call(T, data);
                }
            });
        } else {
            this.init(null, true, true);
        }
    }
    tree.key = {};
    tree.max = 50;
    //一次一级最多能处理的节点数
    tree.rootID = -1;
    //根节点id
    /*
	 * 通过ajax获取数据
	 */
    tree.ajax = function(options) {
        options = options || {};
        var data = options.data, url = options.url, parent = data && data[tree.key.parent];
        //父id
        if (url.indexOf("?") == -1 && !data) {
            //url中没有带参数名 则加载根目录数据tree.rootID
            url += "?" + tree.key.parent + "=" + tree.rootID;
            parent = tree.rootID;
        }
        $.getJSON(url, data, function(json) {
            if (json.status == 1) {
                var Tree = options.tree, _data_ = json.data;
                //获取子节点时，返回数据必须指定父id
                if (_data_ && parent != undefined) {
                    var i, _par = tree.key["parent"];
                    for (i = 0; i < _data_.length; i++) {
                        _data_[i][_par] = parent;
                    }
                }
                if (Tree && _data_) {
                    Tree.data = tree.format(_data_, Tree.data);
                }
                options.success && options.success(_data_);
            }
        });
    };
    /*
	 * 格式化数据json Array对象
	 * 所有节点并列存放，必须指定父节点id(parent),根节点为-1
	 * @Data: 在原数据上添加
	 */
    tree.format = function(data, _Data) {
        var dataType = $.type(data), level = _Data && _Data.level ? _Data.level : [], time = 0, child, key = tree.key, _data = _Data && _Data.all ? _Data.all : {};
        //_Data && console.log(_Data.level)	
        if (dataType != "array" || !data.length || $.type(data[0]) != "object") {
            return {
                all: _data,
                level: level
            };
        }
        child = key["children"];
        dataType = data[0][key["parent"]] == undefined ? 1 : 2;
        function each(Data, _level, _parent) {
            var n = Data.length, i, j, m, id, pid, _n = 0;
            time++;
            for (i = 0; i < n; i++) {
                m = Data[i];
                id = m[key["id"]];
                _n++;
                if (id == undefined || _data[id]) {
                    //没有id或者重复数据
                    continue;
                }
                _data[id] = m;
                pid = m[key["parent"]];
                //该节点的父节点id
                if (pid == tree.rootID) {
                    //一级根节点
                    m.level = _level = 0;
                    m[child] = [];
                } else {
                    //子节点
                    m[child] = [];
                    if (_data[pid]) {
                        //其所属父节点
                        _data[pid][child] = _data[pid][child] || [];
                        _data[pid][child].push(id);
                        if (_Data && level[_level]) {
                            //更新子节点后 ，需要更新其父节点children
                            for (j = 0; j < level[_level].length; j++) {
                                if (level[_level][j][key["id"]] == pid) {
                                    level[_level][j][child] = [].concat(_data[pid][child]);
                                    break;
                                }
                            }
                        }
                        m.level = _level = _data[pid].level + 1;
                    } else {
                        delete _data[id];
                        _n--;
                        continue;
                    }
                }
                level[_level] = level[_level] || [];
                level[_level].push(_data[id]);
            }
            dataType == 2 && _n < n && time < 3 && each(Data);
        }
        each(data, 0);
        return {
            all: _data,
            level: level
        };
    };
    /*
	 * 通过子节点找到其所有父节点路径，返回父节点id数组
	 * @node:子节点id
	 * @data:格式化后的数据
	 * @until:可选，funtion，查询终止条件
	 */
    tree.parents = function(node, data, until) {
        var _parent = tree.key["parent"], _id = tree.key["id"], _par, parents = [];
        data = data || {};
        node = data[node];
        if (!node) {
            return parents;
        }
        _par = node[_parent];
        //父节点id		
        for (;_par = data[_par]; _par = _par[_parent]) {
            if (until && until(_par)) {
                break;
            }
            parents.push(_par[_id]);
        }
        return parents;
    };
    tree.prototype = {
        /*
	     * @set为false表示只返回html
	     * @setDefault
	     */
        init: function(node, set, setDefault) {
            //@node:节点id，初始化该节点下所有一级子节点，为空表示初始化根节点
            var T = this, _link = tree.key["link"], _id = tree.key["id"], _open = tree.key["open"], _name = tree.key["name"], _parent = tree.key["parent"], _child = tree.key["children"], isChild = node != undefined && node != tree.rootID, all = this.data.all, level = isChild ? all[node].level + 1 : 0, data = isChild ? all[node][_child] : this.data.level[level], isCheck = this.options.isCheck, //ajax加载到倒数第二级时 其子级(最后一级)初始化为无子节点的节点 即最后一级不会发送请求
            noChild = this.ajaxMode && this.options.level && this.options.level - 1 == level, item = "", i, j, now, m, link, line, id, open, check, more;
            if (isChild) {
                all[node].init = 2;
            }
            if (!data.length) {
                //该节点无子节点
                if (this.ajaxMode) {
                    var tag = $("#" + all[node][_id]);
                    tag.addClass("no_child").next("ul").remove();
                    if (tag.find(".last_ico1").length) {
                        tag.find(".last_ico1").addClass("last_ico").removeClass("last_ico1");
                    }
                }
                return;
            }
            data["break"] = data["break"] || 0;
            line = "";
            if (level) {
                for (j = 0; j < level; j++) {
                    line += '<i class="line"></i>';
                }
            }
            for (i = data["break"]; i < data.length; i++) {
                if (i >= T.max + data["break"]) {
                    data["break"] += T.max;
                    item += '<li class="no_child more"><a href="" id="more_' + (isChild ? node : tree.rootID) + "_" + level + '" class="item" pid="' + (isChild ? node : tree.rootID) + '" data-action="more">' + line + '<i class="ico last_ico"></i><i class="folder"></i>more</a></li>';
                    break;
                }
                m = data[i];
                m = isChild ? all[m] : m;
                id = m[_id];
                m.init = m.init || 1;
                //标记节点本身初始化
                item += '<li level="' + level + '">';
                link = m[_link] ? m[_link] : "javascript:void(0)";
                //javascript:void(0)for firefox
                open = typeof m[_open] !== "undefined" ? 'open="' + m[_open] + '"' : "";
                check = isCheck ? '<input type="checkbox" value="' + id + '" />' : "";
                noChild = !m[_child].length;
                if (this.ajaxMode) {
                    noChild = null;
                    if (this.options.level && this.options.level - 1 == level) {
                        noChild = true;
                    }
                    if (this.options.formatData && m.ajax) {
                        noChild = !m[_child].length;
                    }
                }
                //console.log(noChild)
                item += '<a class="item' + (noChild ? " no_child" : "") + '" href="' + link + '" reallink="' + link + '" id="' + id + '" ' + open + ">" + line + '<i class="ico"></i>' + check + '<i class="folder"></i><span class="text">' + m[_name] + "</span></a>";
                //this.box[0].id=='tree_test1' && console.log(this.data.level)
                if (!noChild) {
                    //暂不加载子节点，除默认打开节点外
                    if (m[_open] == 1 || T.options.openAll) {
                        //m.init = 2;//标记其子节点初始化
                        item += '<ul data-init="true">';
                        item += this.init(id, false);
                    } else {
                        item += "<ul>";
                    }
                    item += "</ul>";
                }
                item += "</li>";
            }
            if (set) {
                var area = this.box, _node;
                if (isChild) {
                    area = $(item);
                    _node = this.box.find("#" + node);
                    _node.next("ul").data("init", true).append(area);
                    this.addClass(_node.parent());
                } else {
                    if (!this.rootWrap) {
                        this.rootWrap = $("<ul></ul>");
                        area.html(this.rootWrap);
                        this.bind();
                    }
                    this.rootWrap.append(item);
                    this.addClass(area, true);
                }
                this.replaceLink(area);
                (function(area) {
                    var node = area.find("a.item").not(".no_child");
                    //包含子节点
                    //展开全部
                    if (T.options.openAll) {
                        area.find("ul ul").show();
                        node.addClass("open");
                    }
                    //设置默认关闭
                    node.filter(function() {
                        return this.getAttribute("open") == "0";
                    }).removeClass("open").next("ul").hide();
                    //设置默认打开
                    node.filter(function() {
                        return this.getAttribute("open") == "1";
                    }).addClass("open").next("ul").show();
                })(area);
                !this.selected && setDefault && this.select(this.options.defaultNode);
            }
            return item;
        },
        bind: function() {
            var T = this, radio = this.options.radio, //单选模式
            tag, par, sec, link, t;
            this.box.off("click.tree").on("click.tree", function(e) {
                t = e.target;
                tag = $(t);
                par = tag.parent();
                if (tag.attr("data-action") == "more" || par.attr("data-action") == "more") {
                    tag = par.attr("data-action") == "more" ? par : tag;
                    T.init(tag.attr("pid"), true);
                    tag.parent().remove();
                } else if (tag.hasClass("ico") && !tag.parent().hasClass("no_child")) {
                    //折叠
                    tag = tag.parent(".item");
                    sec = tag.next("ul");
                    if (tag.hasClass("open")) {
                        sec && sec.is(":visible") && sec.hide();
                        tag.removeClass("open");
                    } else {
                        var node = tag[0].id, needAjax = T.ajaxMode, ajaxData = {};
                        if (T.data.all[node].init != 2) {
                            //子节点未初始化
                            //child = T.data.all[node][tree.key['children']][0];
                            //初始化该节点
                            if (T.options.formatData && T.options.formatData.all[node] && T.options.formatData.all[node].ajax) {
                                needAjax = null;
                            }
                            ajaxData[tree.key.parent] = node;
                            needAjax ? tree.ajax({
                                url: T._data,
                                data: ajaxData,
                                tree: T,
                                success: function(data) {
                                    T.init(node, true);
                                    T.data.all[node].ajax = 1;
                                    T.options.ajaxSuccess && T.options.ajaxSuccess.call(T, data, T.data.all[node]);
                                }
                            }) : T.init(node, true);
                        }
                        sec && sec.is(":hidden") && sec.show();
                        tag.addClass("open");
                    }
                } else if (tag.hasClass("folder") || tag.hasClass("item") || tag.hasClass("text") || tag.hasClass("line") || tag.hasClass("ico")) {
                    //选中
                    if (!T.options.onSelect) {
                        return false;
                    }
                    if (!tag.hasClass("item")) {
                        tag = tag.parent();
                    }
                    if (T.selected == tag[0].id) {}
                    T.box.find("a.current").removeClass("current");
                    tag.addClass("current");
                    T.options.onSelect && T.options.onSelect.call(T, T.data.all[tag[0].id]);
                    //执行事件
                    T.selected = tag[0].id;
                } else if (t.tagName.toLowerCase() == "input" && t.type == "checkbox") {
                    var children = tag.closest("a.item").next("ul").find("input"), parent = tag.parents("ul"), i, m;
                    if (t.checked) {
                        if (T.options.onCheckBefore && !T.options.onCheckBefore.call(T, T.data.all[t.value])) {
                            return false;
                        }
                        //选择后 子项全部选中
                        //T.relationChildren
                        //T.relationParent
                        radio && tag.closest("ul").find("input").not(t).attr("checked", false);
                        T.relationChildren && children.attr("checked", "checked");
                        //子项全部选中后，父项自动选中
                        for (var i = 0; i < parent.length; i++) {
                            m = parent.eq(i);
                            if (!m.find("input").not(":checked").length || radio) {
                                if (radio) {}
                                T.relationParent && m.prev("a.item").find("input").attr("checked", "checked");
                            }
                        }
                    } else {
                        T.relationChildren && children.attr("checked", false);
                        T.relationParent && parent.prev("a.item").find("input").attr("checked", false);
                    }
                    T.getChecked();
                    T.options.onCheck && !T.options.onCheck.call(T, T.data.all[t.value], t);
                    return true;
                }
                return false;
            });
        },
        //更新属性this.checked
        getChecked: function() {
            var checked = this.box.find("input:checked");
            this.checked = checked.length ? function() {
                var rect = [];
                checked.each(function() {
                    rect.push(this.value);
                });
                return rect;
            }() : null;
        },
        addClass: function(area, root) {
            area = area || this.box;
            var list = area.find("a.item"), n = list.length, i, j, q, l, m, o, li, level;
            root && list.eq(0).find(".ico").addClass("first_ico");
            for (i = 0; i < n; i++) {
                m = list.eq(i);
                li = m.closest("li");
                if (!m.next("ul").length) {
                    //无子节点
                    !this.ajaxMode && m.addClass("no_child");
                    if (!li.next().length) {
                        m.find(".ico").addClass("last_ico");
                    }
                } else {
                    !li.next().length && m.find(".ico").addClass("last_ico1");
                    //有子节点并为最后一条
                    level = li.attr("level");
                    for (j = 0; j < li.find("li").length; j++) {
                        o = li.find("li").eq(j).find(".line");
                        !li.next().length && o.eq(level).addClass("last_line");
                        q = m.find(".last_line");
                        for (l = 0; l < q.length; l++) {
                            o.eq(q.eq(l).index()).addClass("last_line");
                        }
                    }
                }
            }
        },
        /*
		 * 设置当前节点
		 * @ID:属性值
		 * @by:属性 通过该属性来查找节点，默认通过id
		 */
        select: function(ID, by) {
            if (!ID) {
                return;
            }
            by = by || "id";
            var T = this, node = this.box.find("a[" + by + '="' + ID + '"]').eq(0), all = this.data.all, _parent = tree.key["parent"], parents = [], i, _node;
            if (!all[ID]) {
                return;
            }
            if (!node || !node.length) {
                //从当前节点依次往上寻找父节点，直到找到已经初始化的节点为止
                parents = tree.parents(ID, this.data.all, function(parent) {
                    return parent.init == 2;
                });
                if (parents.length) {
                    //然后从最外层的父节点开始初始化
                    for (i = parents.length - 1; i >= 0; i--) {
                        _node = all[parents[i]];
                        while (!_node.init) {
                            $("#more_" + _node[_parent] + "_" + _node.level).click();
                        }
                        $("#" + parents[i]).find("i.ico").click();
                    }
                    parents = $("#" + parents[0]).next();
                } else {
                    parents = $("#" + all[ID][_parent]).next();
                }
                //所有父节点展开后再获取该节点
                node = parents.find("a[" + by + '="' + ID + '"]').eq(0);
                if (!node.length) {
                    //超出了max
                    while (!all[ID].init) {
                        $("#more_" + all[ID][_parent] + "_" + all[ID].level).click();
                    }
                    node = parents.find("a[" + by + '="' + ID + '"]').eq(0);
                }
            }
            this.box.find("a.current").removeClass("current");
            //T.selected = ID;//当前选中节点
            if (node.parents("ul").first().is(":visible")) {
                return set();
            }
            var ul = node.parents("ul").not(":visible"), len = ul.length, m;
            function set() {
                node.addClass("current");
                T.options.onSelect && T.options.onSelect.call(T, T.data.all[ID]);
                //执行事件
                T.selected = ID;
                return false;
            }
            function s(i) {
                if (i < 0) {
                    return;
                }
                m = ul.eq(i);
                m.show().siblings("a.item").addClass("open");
                s(--i);
            }
            s(len - 1);
            //从最外层父ul开始展开
            set();
        },
        /*
		 * 选中指定的checkbox
		 * @id string|number单个id | Array一组id 
		 */
        check: function(id, checked) {
            var self = this, tag;
            function deal(id) {
                if (id && self.data.all[id]) {
                    checked = checked == false ? false : true;
                    tag = $("#" + id).find("input")[0];
                    if (checked) {
                        !tag.checked && tag.click();
                    } else {
                        tag.checked && tag.click();
                    }
                    self.getChecked();
                }
            }
            typeof id == "number" || typeof id == "string" ? deal(id) : $.each(id, function(i, _id) {
                deal(_id);
            });
        },
        //打开某个节点
        open: function(id) {
            var tag;
            if (id && this.data.all[id]) {
                this.data.all[id].init = "pending";
                //标记正在打开 判断重复ajax操作时可以用该状态检测
                tag = $("#" + id);
                !tag.hasClass("open") && tag.find(".ico").click();
            }
        },
        replaceLink: function(area) {
            //ie67下会自动补全url为绝对路径
            //使用 getAttribute( 'href', 2 ) 可解决
            if ($.browser("ie6 ie7")) {
                area = area || this.box;
                var a = area.find("a"), link;
                a.each(function() {
                    this.href = this.getAttribute("reallink", 2);
                    this.removeAttribute("reallink");
                });
            }
        }
    };
    //通过一个select来展现树形结构或者是级联菜单
    tree.select = function(box, options) {
        options = options || {};
        tree.key = $.extend({
            id: "id",
            name: "name",
            parent: "parent",
            children: "children",
            open: "open",
            link: "link"
        }, tree.key);
        var formatData = options.formatData, Data = formatData ? formatData : typeof options.data == "string" ? {} : tree.format(options.data), selected = [].concat(options.select), single = options.level == 0, ajaxMode = typeof options.data == "string", data = ajaxMode ? [] : Data.level, emptyID = options.empty != undefined ? options.empty : "", empty, _id = tree.key["id"], _name = tree.key["name"], _par = tree.key["parent"], _child = tree.key["children"], ui = $.extend(true, {
            event: "onchange",
            value: "value",
            element: "select",
            destroy: "destroy"
        }, options.ui), //select对象Array
        items = [];
        if (!box || !box.length || !data) {
            return;
        }
        function getChild(child, level) {
            var j, item = "", _data;
            if (child && child.length) {
                for (j in child) {
                    _data = child[j];
                    _data = typeof _data == "string" ? Data.all[_data] : _data;
                    item += getItem(_data, level);
                }
            }
            return item;
        }
        function getLine(level) {
            var line = "--", i;
            for (i = 0; i < level; i++) {
                line += "--";
            }
            return line;
        }
        function getItem(m, level) {
            return '<option value="' + (m[_id] != undefined ? m[_id] : "") + '">' + (single ? getLine(m.level) : "") + m[_name] + "</option>" + (single ? getChild(m[_child], level) : "");
        }
        empty = '<option value="' + emptyID + '">请选择</option>';
        function addItem(parentID) {
            var i, name, level = 0, item = "", child = !parentID ? data[level] : Data.all[parentID][_child];
            if (!child.length) {
                return;
            }
            parentID && (Data.all[parentID].init = 1);
            level = !parentID ? 0 : Data.all[parentID].level + 1;
            name = options.name ? options.name[level] : "";
            item = '<select name="' + name + '">';
            item += level == 0 && single ? '<option value="' + tree.rootID + '">根目录</option>' : empty;
            item += getChild(child, level);
            item += "</select>";
            item = $(item);
            if (selected[level] != undefined) {
                item[0].value = selected[level];
                selected[level] = null;
            }
            box.append(item);
            items[level] = item[0];
            var option = {};
            option[ui.event] = function() {
                change(this, level);
            };
            option.value = item.val();
            //默认value
            if (ui.init) {
                items[level] = ui.init(item, option);
            } else {
                //默认select样式
                item[0][ui.event] = option[ui.event];
                option.value && change(item[0], level);
            }
            //若没有默认值(options.value=undefined) 且设置了options.level固定级数 则自动初始化下一级
            if (!options.value && options.level && level + 1 < options.level) {}
            return item;
        }
        addItem.empty = function(level) {
            var name = options.name ? options.name[level] : "", item = '<select name="' + name + '">' + empty + "</select>";
            box.append(item);
        };
        addItem.bind = function() {};
        ajaxMode ? ajax() : addItem();
        function ajax(_data, callback) {
            var pid = _data && _data[_par];
            if (formatData && (!pid || pid && Data.all[pid].ajax)) {
                call();
                return;
            }
            tree.ajax({
                url: options.data,
                data: _data,
                success: function(_data_) {
                    if (pid) {
                        Data.all[pid].ajax = 1;
                    }
                    if (_data_ && _data_.length) {
                        Data = tree.format(_data_, Data);
                        call();
                    }
                    options.ajaxSuccess && options.ajaxSuccess(_data_, pid, Data);
                }
            });
            function call() {
                data = Data.level;
                if (callback) {
                    callback();
                } else {
                    addItem();
                }
            }
        }
        function change(item, level) {
            var id = item[ui.value], data = {}, element = ui.element == "select" ? $(item) : item[ui.element];
            data[_par] = id;
            options.onSelect && options.onSelect(id, Data);
            //item[ui.destroy] && item[ui.destroy]();
            element.nextAll(element).remove();
            if (id == emptyID || !Data.all[id]) {
                return;
            }
            //固定级数后 最后一级不继续事件
            if (single || options.level && level + 1 >= options.level) {
                return;
            }
            if (ajaxMode && !Data.all[id].init) {
                ajax(data, function() {
                    addItem(id);
                });
            } else {
                addItem(id);
            }
        }
        return {
            select: function(ids) {
                //重新设置选中项 前提是已初始化一次
                if ($.type(ids) != "array" || !ids.length) {
                    return;
                }
                selected = ids;
                box.empty();
                addItem();
            }
        };
    };
    return tree;
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
