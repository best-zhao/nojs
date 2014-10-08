noJS.css([ domain.rs + "/css/nojs/tree.css", domain.rs + "/css/nojs/select.css", domain.rs + "/css/nojs/codelight.css" ]);

define("docs/init", [ "lib/jquery/jquery", "./index", "lib/nojs/ui", "./menu", "./url", "../lib/nojs/mods/tree", "./key", "../lib/nojs/mods/codelight", "../lib/nojs/mods/layer", "./demo" ], function(require) {
    var $ = require("lib/jquery/jquery"), docs = require("./index"), codeLight = require("../lib/nojs/mods/codelight"), layer = require("../lib/nojs/mods/layer"), demo = require("./demo");
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

/**
 * 弹层相关组件
 * 包含浮动层，弹窗，遮罩，消息提示窗
 */
define("lib/nojs/mods/layer", [ "lib/jquery/jquery", "lib/nojs/ui" ], function(require) {
    var $ = require("lib/jquery/jquery"), ui = require("lib/nojs/ui"), layer = {};
    /*
     * 浮动层
     */
    layer.overlay = function(options) {
        options = $.extend(true, {}, ui.config.overlay, options);
        //className主要用于全局配置 name则用于单个实例配置
        options.className = [ options.className || "", options.name || "" ].join(" ");
        var insertTo = (options.parent ? window.parent : window).document;
        options.insertTo = options.insertTo == "body" ? insertTo.body : $(insertTo).find(options.insertTo);
        layer.overlay.baseConstructor.call(this, options);
        //this.insertTo
        this.visible = false;
        //可视状态
        this.content = null;
        //内容区域
        this.arrow = this.options.arrow;
        //箭头 根据align对齐方式自动调整指向
        this.timeout = this.options.timeout;
        this.onShow = this.options.onShow;
        this.onHide = this.options.onHide;
        layer.overlay.item.push(this);
        this.init();
    };
    ui.config.overlay = {
        showClassName: "nj_overlay_show",
        insertTo: "body"
    };
    ui.extend(layer.overlay, ui.align);
    ui.extend.proto(layer.overlay, {
        set: function(fn, key, value) {
            if (key == "content") {
                this.content.empty().append(value);
            } else {
                fn.call(this, value);
            }
        }
    });
    layer.overlay.item = [];
    layer.overlay.hide = function() {
        var item = layer.overlay.item, n = item.length, i = 0;
        for (;i < n; i++) {
            item[i].hide();
        }
    };
    layer.overlay.prototype.init = function() {
        var self = this;
        this.element = $('<div class="v_hide d_show nj_overlay ' + this.options.className + '"><div class="nj_overlay_wrap"></div></div>').appendTo(this.options.insertTo);
        this.content = this.element.find(".nj_overlay_wrap");
        if (this.arrow) {
            this.arrow.element = $('<div class="nj_overlay_arrow"></div>').appendTo(this.element);
            this.arrow.offset = this.arrow.offset || [ 0, 0 ];
        }
        this._effect = new ui.effect(this.element, this.options.effect);
        this.bind();
    };
    layer.overlay.prototype.show = function(callback) {
        if (this.visible) {
            return;
        }
        var self = this;
        this.element.addClass(this.options.showClassName);
        if (this.timeout) {
            this.autoHide = setTimeout(function() {
                self.hide();
            }, this.timeout);
        }
        this._effect.show();
        this.visible = true;
        this.set();
        callback && callback.call(this);
        this.onShow && this.onShow.call(this);
        return;
        if (self.arrow) {
            var top = 0, left = 0, direction = self.arrow.direction || pos[2];
            if (direction == "up" || direction == "down") {} else if (direction == "left" || direction == "right") {}
            self.arrow.element.css({
                top: top,
                left: left
            }).attr("class", "nj_overlay_arrow nj_overlay_arrow_" + direction);
        }
    };
    layer.overlay.prototype.hide = function(callback) {
        if (!this.visible) {
            return;
        }
        this._effect.hide();
        this.element.removeClass(this.options.showClassName);
        this.autoHide = clearTimeout(this.autoHide);
        this.visible = false;
        callback && callback.call(this);
        this.onHide && this.onHide.call(this);
    };
    layer.overlay.prototype.on = function(options) {
        options = options || {};
        var self = this, mode = options.mode || ui.config.eventType, agent = $.type(options.element) == "array" && options.element.length > 1, hasNearby = !!this.nearby, element = ui.dom(agent ? options.element[0] : options.element) || this.nearby, hoverClass = this.options.hoverClass || "nj_overlay_show", isHover, show, hide, showTime, hideTime, hideEvent;
        if (!element) {
            return;
        }
        isHover = mode == "mouseover";
        hideEvent = isHover ? " mouseout" : "";
        show = function(e) {
            var t, tag, type, el;
            if (agent) {
                t = e.target;
                tag = t.tagName.toLowerCase();
                el = options.element[1];
                type = typeof el;
                if (type == "function") {
                    el = el.call(t, tag);
                } else if (type == "string") {
                    el = $(t).closest(el);
                    if (!el.length) {
                        return;
                    }
                } else {
                    el = null;
                }
                if (!el) {
                    return;
                }
                var now = $(typeof el == "boolean" ? t : el);
                // 返回的el是对象时 该对象作为self.nearby对象
                self.visible && self.set("align", {
                    nearby: now
                });
                self.visible && self.nearby.removeClass(hoverClass);
                self.nearby = now;
            } else if (!hasNearby) {
                element.length > 1 && self.hide();
                //self.options.pop && console.log(this)
                self.nearby = $(this);
            }
            el = $(this);
            if (isHover) {
                hideTime = clearTimeout(hideTime);
                showTime = setTimeout(function() {
                    if (!agent && !hasNearby) {
                        self.nearby = el;
                    }
                    show.e();
                }, 50);
            } else {
                !hideEvent && self.visible ? self.hide() : show.e();
            }
            e.preventDefault();
            //当元素上同时也绑定了其他事件时，可以设置options.stopBubble==false
            if (!isHover && options.stopBubble !== false) {
                e.stopPropagation();
            }
        };
        show.e = function() {
            self.show();
            self.nearby.addClass(hoverClass);
            options.callback && options.callback.call(self);
        };
        hide = function(e) {
            e.stopPropagation();
            hideEvent ? !function() {
                showTime = clearTimeout(showTime);
                hideTime = setTimeout(function() {
                    self.hide();
                }, 10);
            }() : self.hide();
        };
        var _onHide = this.onHide;
        this.onHide = function() {
            _onHide && _onHide.call(this);
            self.nearby && self.nearby.removeClass(hoverClass);
            if (!hasNearby) {}
        };
        element.on(mode, show);
        hideEvent && element.on(hideEvent, hide);
        !isHover && !function() {
            $(document).on(mode, hide);
            self.element.on(mode, function(e) {
                e.stopPropagation();
            });
        }();
        isHover && this.element.hover(function() {
            hideTime = clearTimeout(hideTime);
        }, hide);
    };
    layer.overlay.prototype.destroy = function() {
        this.element.remove();
    };
    layer.mask = function() {
        /*
         * 遮罩层
         */
        var w = $(window), layer = $("#nj_layer"), arr = {
            show: show,
            hide: hide
        }, effect;
        function init() {
            layer = $('<div id="nj_layer" class="nj_layer"></div>').appendTo(document.body);
            if ($.browser("ie6")) {
                S = function() {
                    layer.css({
                        width: w.width(),
                        height: w.height()
                    });
                };
                S();
                w.on("scroll resize", S);
                new ui.align({
                    element: layer
                });
            }
            $.onScroll(layer[0]);
            arr.element = layer;
            effect = new ui.effect(layer);
        }
        function show() {
            !document.getElementById("nj_layer") && init();
            layer.addClass("nj_layer_show");
            effect.show();
        }
        function hide() {
            if (!layer || !effect) {
                return;
            }
            layer.removeClass("nj_layer_show");
            effect.hide();
        }
        return arr;
    }();
    layer.popup = function(options) {
        options = $.extend(true, {}, ui.config.popup, options);
        options.name = [ "nj_win", options.name || "" ].join(" ");
        options.nearby = options.nearby || (options.parent ? window.parent : window);
        layer.popup.baseConstructor.call(this, options);
        this.theme = options.themeItem[options.theme];
        this.close = null;
        this.title = null;
        this.operating = null;
        this.mask = options.mask == false ? false : true;
        this.bindEsc = options.bindEsc == false ? false : true;
        this.onShow = options.onShow;
        this.onHide = options.onHide;
        this.create();
    };
    ui.config.popup = {
        themeItem: {
            "default": {
                button: {
                    base: "nj_btn",
                    submit: "n_b_sb"
                }
            }
        },
        width: 400,
        theme: "default",
        className: "drop_pop",
        showClassName: "drop_pop_show"
    };
    ui.extend(layer.popup, layer.overlay);
    ui.extend.proto(layer.popup, {
        set: function(fn, key, value) {
            /*
                                   设置标题、内容、按钮
            */
            if (key == "title") {
                value && this.title.html(value).show();
            } else if (key == "button") {
                this.button = [];
                this.operating.empty()[value ? "show" : "hide"]();
                //重设操作区
                if (value) {
                    for (var i = 0; i < value.length; i++) {
                        this.addBtn.apply(this, value[i]);
                    }
                }
            } else {
                fn.call(this, key, value);
            }
        },
        show: function(fn, callback) {
            /*
                                            显示弹窗
                @callBack:可选参数，回调函数
            */
            if (this.visible) {
                return;
            }
            this.mask && layer.mask.show();
            fn.call(this, callback);
            //this.bindEsc && layer.popup.focus.push(this);
            if (this.bindEsc && !layer.popup.focus[this.key]) {
                layer.popup.focus[this.key] = this;
            }
        },
        hide: function(fn, callback) {
            /*
                                            隐藏弹窗
                @callBack:可选参数，回调函数
            */
            if (!this.visible) {
                return;
            }
            var self = this, hideMask = this.mask;
            /*
             * onbeforehide:关闭之前确认
             */
            if (this.onbeforehide && !this.onbeforehide()) {
                return;
            }
            fn.call(self, callback);
            this.mask && $.each(layer.popup.item, function() {
                //检测其他弹窗看是否需要保留遮罩
                if (this.key != self.key && this.visible && this.mask) {
                    hideMask = false;
                    return false;
                }
            });
            hideMask && layer.mask.hide();
            delete layer.popup.focus[this.key];
        }
    });
    layer.popup.prototype.create = function() {
        var self = this, id = "nj_popup_" + +new Date();
        layer.popup.item[id] = this;
        this.key = id;
        this.set("content", [ '<span class="win_close closeBtn">×</span><div class="win_tit"></div>', '<div class="win_con clearfix"></div>', '<div class="win_opt"></div>' ].join(""));
        this.content.addClass("win_wrap");
        if (this.options.fullScreen) {
            //全屏
            this.element.css({
                width: "100%",
                height: "100%"
            });
            this.position = {
                top: 0,
                left: 0
            };
            this.element.addClass("full_pop");
            this.layer = null;
        } else {
            this.element.css({
                width: this.options.width
            });
        }
        this.element[0].id = id;
        this.close = this.element.find(".win_close");
        this.title = this.element.find(".win_tit").hide();
        this.content = this.element.find(".win_con");
        this.operating = this.element.find(".win_opt").hide();
        this.close.on(ui.config.clickEvent, function() {
            //绑定关闭按钮事件
            self.hide();
        });
        this.bindEsc && !layer.popup.bind.init && layer.popup.bind();
        $.onScroll(this.element[0]);
    };
    layer.popup.prototype.addBtn = function(text, callback, color) {
        /*
                       增加一个操作区按钮
        @text:按钮文字
        @color:按钮样式，即class类名
        @callBack:按钮click绑定的函数,"close"则为关闭
        */
        if (text === undefined) {
            return;
        }
        this.operating.is(":hidden") && this.operating.show();
        this.button = this.button || [];
        var T = this, html = typeof text == "string" && /[<>]/.test(text), //自定义按钮html
        btn = $(html ? text : '<a href=""></a>'), color = color ? color : "", theme = this.theme.button || {};
        if (typeof callback == "string" && callback != "close") {
            //无回调时，第二个参数作为按钮颜色
            color = callback;
            callback = null;
        }
        !html && btn.attr({
            "class": color == "no" ? "" : theme.base + " " + (theme[color] || "")
        });
        !html && btn.html(text);
        this.operating.append(btn);
        this.button.push(btn);
        if (callback) {
            callback = callback == "close" ? function() {
                T.hide();
            } : callback;
            btn.on(ui.config.clickEvent, function() {
                callback.call(T);
                return false;
            });
        }
    };
    layer.popup.item = {};
    //保存所有弹框实例对象
    layer.popup.clear = function(key) {
        //清空弹框对象
        if (key) {
            var win = layer.popup.item[key];
            win && clear(win);
        } else {
            for (var i in layer.popup.item) {
                clear(layer.popup.item[i]);
            }
            layer.popup.item = {};
            layer.msg.win = null;
        }
        function clear(win) {
            win.self.remove();
            win = null;
        }
    };
    layer.popup.focus = {};
    //处于焦点的弹窗
    layer.popup.bind = function() {
        if (layer.popup.bind.init) {
            return;
        }
        layer.popup.bind.init = true;
        $(document).on("keydown", function(e) {
            //按下esc键隐藏弹窗
            if (e.keyCode == 27) {
                var i, pop;
                for (i in layer.popup.focus) {
                    pop = layer.popup.focus[i];
                }
                pop && pop.bindEsc && pop.visible && pop.hide();
            }
        });
    };
    layer.msg = function() {
        /*
         * 消息提示框
         */
        var Win = {};
        ui.config.msg = {
            //不限宽度
            width: null
        };
        return {
            show: function(type, tip, opt) {
                var T = this, C = type == "confirm";
                opt = $.extend(true, {
                    title: C && "温馨提醒：",
                    bindEsc: C ? true : false
                }, ui.config.msg, opt);
                var C = type == "confirm", timeout = opt.timeout != undefined ? opt.timeout : 1600, btn = opt.button, win = Win[type];
                //隐藏其他
                this.hide(true);
                tip = tip || "";
                if (type == "loading") {
                    tip = tip || "正在处理请求,请稍候……";
                } else if (C) {
                    btn = btn || [ [ "确定", function() {
                        win.hide(function() {
                            typeof opt.ok == "function" && opt.ok.call(this);
                        });
                    }, "submit" ], [ "取消", "close" ] ];
                }
                if (!win || !$("#" + win.key).length) {
                    opt.name = "msg_tip_win msg_tip_" + type + " " + (opt.name || "");
                    win = new layer.popup(opt);
                    //win.element.find('div.nj_overlay_wrap').addClass('msg_tip_'+type);
                    win.set("title", opt.title);
                    win.set("content", '<div class="con clearfix"><i class="tip_ico"></i><span class="tip_con"></span></div>');
                    new ui.ico(win.content.find("i.tip_ico"), {
                        type: C ? "warn" : type
                    });
                    Win[type] = win;
                    if (C) {
                        win.onShow = function() {
                            layer.mask.element.addClass("higher_layer");
                        };
                        win.onHide = function() {
                            layer.mask.element.removeClass("higher_layer");
                        };
                    }
                }
                win.layer = C ? true : opt.layer;
                //自动隐藏                            
                win.timeout = !C && type != "loading" && !opt.reload ? timeout : 0;
                if (opt.reload) {
                    setTimeout(function() {
                        if (opt.reload === true) {
                            location.reload();
                        } else if (typeof opt.reload == "string") {
                            location.href = opt.reload;
                        }
                    }, 1500);
                }
                !btn && win.operating.hide().empty();
                //重设操作区
                win.set("button", btn);
                win.content.find(".tip_con").html(tip);
                win.show();
                C && win.button[0].focus();
                return win;
            },
            hide: function(now) {
                for (var i in Win) {
                    now && Win[i].element.addClass("v_hide");
                    Win[i].hide();
                }
            }
        };
    }();
    return layer;
});

define("docs/demo", [ "lib/jquery/jquery", "docs/index", "lib/nojs/ui", "docs/menu", "docs/url", "lib/nojs/mods/tree", "docs/key" ], function(require) {
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
