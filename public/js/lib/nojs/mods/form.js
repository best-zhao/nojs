/*
 * form 表单验证
 */
define("lib/nojs/mods/form", [], function(require, $, ui) {
    var form = function(options) {
        this.options = options = config(options);
        this.button = options.button;
        //指定了button对象，则通过button的click触发submit
        this.formSubmit = this.button && this.button.length ? false : true;
        //是否为表单提交
        var el = typeof options.form == "string" ? $("#" + options.form) : $(options.form);
        this.form = el || this.button && this.button.closest("form");
        if (!this.form || !this.form.length) {
            return;
        }
        var realForm = this.form[0].tagName.toLowerCase() == "form";
        //没有指定触发按钮 也不是真正的form对象 则无效
        if (this.formSubmit && !realForm) {
            return;
        }
        if (realForm && !this.button) {
            //默认this.button为真实form中type=submit对象
            this.button = this.form.find('[type="submit"]');
        }
        this.rules = options.rules;
        this.item = [];
        //存储所需验证对象
        options.showIco = options.showIco == false ? false : options.showIco || true;
        //是否显示提示图标
        options.focusOnError = options.focusOnError == false ? false : true;
        //错误时是否获得焦点        
        this.checkMode = options.checkMode || "submit";
        //验证模式 'blur/keyup'
        this.init();
    }, config = function(options) {
        var gConfig = typeof form.config == "function" ? form.config(options) : form.config;
        return $.extend(true, {}, gConfig, options);
    };
    form.prototype = {
        init: function(rules) {
            var i, j, name, _rules = rules || this.rules, T = this;
            //rules 传入新的规则重新初始化表单				
            this.rules = $.extend(true, {}, _rules);
            //copy副本
            this.item = [];
            if (!_rules) {
                var item = this.form.find("[data-rule]");
                item.each(function() {
                    var rule = eval("({" + $(this).data("rule") + "})"), rules = {};
                    if (this.name) {
                        T.rules[this.name] = rule;
                    }
                });
            }
            for (i in this.rules) {
                name = $.trim(i);
                if (name.indexOf(" ") > 0) {
                    //添加多个相同的规则
                    name = name.split(" ");
                    for (j = 0; j < name.length; j++) {
                        T.push(name[j]);
                    }
                } else {
                    T.push(name);
                }
            }
            !rules && this.bind();
        },
        push: function(name, rule) {
            var T = this, m = T.form.find("[name='" + name + "']"), replace;
            if (!m.length) {
                return;
            }
            rule = this.rules[name];
            function replace(replace, m) {
                if (replace) {
                    //如果该对象为隐藏域或其他不可见的元素，可设置一个用于标记的替换元素
                    replace = typeof replace === "function" ? replace.call(m) : replace;
                    m.data("replace", replace);
                }
            }
            replace(rule.replace, m);
            var type = T.type(m);
            if ((type == "checkbox" || type == "radio") && rule["isNull"] === undefined) {
                return;
            }
            T.item.push(m);
            if (type == "input" || type == "textarea") {
                (function(m, rule) {
                    //validate
                    m.off("keyup.validate").on("keyup.validate", function() {
                        $(this).data("state", false);
                    });
                    //focus tip
                    rule.$focus && m.off("focus.validate").on("focus.validate", function() {
                        if (!$(this).data("state")) {
                            form.state($(this), "focus", rule.$focus, T.options.icoPosition);
                        }
                    });
                    if (!T.formSubmit && T.type(m) == "input") {
                        //绑定回车提交事件
                        m.off("keyup.validate").on("keyup.validate", function(e) {
                            $(this).data("state", false);
                            e.keyCode == 13 && T.button.click();
                        });
                    }
                    if (m.attr("type") === "password") {
                        //确认密码
                        var c = rule["confirmPas"], //{name:确认密码name,empty:'为空时提示语',error:'错误提示语'}
                        M, rName;
                        if (c && c["name"]) {
                            M = T.form.find("[name='" + c["name"] + "']");
                            //确认密码对象
                            rName = "rePas" + +new Date();
                            //使用随机名称，防止form.reg方法重名
                            m.off("keyup.validate").on("keyup.validate", function() {
                                //再次修改新密码时
                                m.data("state", false);
                                M.data("state", false);
                            });
                            M.off("keyup.validate").on("keyup.validate", function() {
                                M.data("state", false);
                            });
                            form.reg[rName] = function(v, opt, e) {
                                //确认密码验证函数
                                if (m.val() == v) {
                                    return true;
                                } else {
                                    return false;
                                }
                            };
                            var _rule = $.extend(true, {}, rule, {
                                isNull: typeof c["isNull"] != "undefined" ? c["isNull"] : "请填写确认密码"
                            });
                            delete _rule["confirmPas"];
                            _rule[rName] = typeof c["error"] != "undefined" ? c["error"] : "两次密码输入不一致";
                            replace(_rule.replace, M);
                            M.data("formInit", true);
                            M.data("rule", _rule);
                            M.data("state", false);
                            T.rules[c["name"]] = _rule;
                            T.item.push(M);
                        }
                    }
                })(m, rule);
            } else if (type == "checkbox" || type == "radio") {
                _rule = {};
                _rule["isLength"] = rule["isLength"] || [];
                _rule["isLength"][0] = _rule["isLength"][0] || rule["isNull"];
                _rule["isLength"][1] = _rule["isLength"][1] || {};
                if (type == "radio") {
                    _rule["isLength"][1].min = 1;
                } else {
                    _rule["isLength"][1].min = _rule["isLength"][1].min || 1;
                }
                rule = _rule;
            }
            m.data("formInit", true);
            m.data("rule", rule);
            //将验证规则存储在该对象中
            m.data("state", false);
        },
        bind: function() {
            var M, A, type, T = this;
            //提交时验证
            this.form.submit(function() {
                return T.submit();
            });
            if (!this.formSubmit) {
                this.button.click(function() {
                    if (T.form[0].tagName.toLowerCase() == "form") {
                        T.form.submit();
                    } else {
                        T.submit();
                    }
                    return false;
                });
            }
            //输入或失去焦点时验证
            if (this.checkMode && (this.checkMode == "keyup" || this.checkMode == "blur")) {
                for (var i = 0; i < T.item.length; i++) {
                    M = T.item[i];
                    type = this.type(M);
                    if (type == "input" || type == "textarea") {
                        if (this.checkMode == "keyup") {
                            this.checkMode = "keyup blur";
                        }
                        M.on(this.checkMode, function() {
                            m = $(this);
                            clearTimeout(A);
                            A = setTimeout(function() {
                                T.check(m);
                            }, 90);
                        });
                    } else if (type == "checkbox" || type == "select") {
                        M.on("change", function() {
                            T.check($(this));
                        });
                    }
                }
            }
        },
        type: function(e) {
            /*
			 * 检测表单对象类型
			 */
            if (!e || !e.length) {
                return "text";
            }
            var tag = e[0].tagName.toLowerCase(), type = tag;
            if (tag == "input") {
                if (e.attr("type") == "checkbox") {
                    type = "checkbox";
                } else if (e.attr("type") == "radio") {
                    type = "radio";
                } else if (e.attr("type") == "hidden") {
                    type = "hidden";
                }
            }
            return type;
        },
        check: function(m, isSubmit, _rule) {
            /*
			 * 验证对象name或者对象本身
			 * isSubmit : true提交表单验证动作； 0 只获取验证结果 否则为其他动作 如失去焦点验证
			 * _rule : 使用新的临时规则
			 */
            var name = typeof m == "string" ? m : m[0].name;
            m = this.form.find('[name="' + name + '"]');
            var type = this.type(m);
            if (!m.length || m.is(":hidden") && type != "hidden") {
                //隐藏域.is(':hidden')返回true
                return true;
            }
            if (!m.data("formInit")) {
                //动态添加的元素
                this.push(name);
            }
            var T = this, n = _rule || m.data("rule"), t = false, v, M, tip = "", opt, s, group, state = form.state, reg = form.reg;
            if (!n) {
                return true;
            }
            if (type == "checkbox" || type == "radio") {
                v = m.filter(":checked").length;
                M = n["isLength"];
                tip = getMessage(M[0], "isLength");
                opt = M[1];
                if (reg["isLength"](v, opt, m)) {
                    t = true;
                    isSubmit !== 0 && this.options.showIco && state(m.last(), this.options.showIco == "error" ? null : "ok", this.options.icoPosition);
                } else {
                    t = false;
                    isSubmit !== 0 && this.options.showIco && state(m.last(), "error", tip, this.options.icoPosition);
                    m.last().focus();
                }
                m.data("state", t);
                return t;
            }
            v = m.val();
            if (typeof n.isNull == "undefined") {
                //选填项
                if ((type == "input" || type == "textarea") && v == "") {
                    m.data("state", true);
                    //this.options.showIco && state(m);
                    return true;
                }
            }
            if ((type == "input" || type == "textarea") && m.data("state") == true && v != "") {
                //已符合规则，不用验证
                return true;
            }
            for (var j in n) {
                M = n[j];
                if (reg[j]) {
                    //有效的规则
                    if ($.type(M) == "array") {
                        tip = M[0];
                        opt = M[1];
                    } else {
                        tip = M;
                    }
                    tip = typeof tip === "function" ? tip.call(m) : tip;
                    tip = getMessage(tip, j);
                    if (j == "remote") {
                        //ajax验证
                        //s = false;
                        m.data("tip", tip);
                        if (isSubmit) {
                            opt.callback = function() {
                                T.submit();
                            };
                        }
                    }
                    if (type == "select" && v == 0) {
                        s = false;
                    } else {
                        s = reg[j].call(T, v, opt, m);
                    }
                    if (s == true) {
                        //满足规则   /*传入3个参数：val,特殊匹配规则,匹配的元素
                        t = true;
                        isSubmit !== 0 && this.options.showIco && state(m, this.options.showIco == "error" ? null : "ok", null, this.options.icoPosition);
                    } else if (s == false) {
                        //不满足规则
                        isSubmit !== 0 && this.options.showIco && state(m, "error", tip, this.options.icoPosition);
                        if (isSubmit) {
                            this.options.focusOnError && m.focus();
                            if (m[0].type == "hidden" && m.data("replace")) {
                                $(window).scrollTop(m.data("replace").offset().top);
                            }
                        }
                        t = false;
                    } else if (s == "pending") {
                        //请求ing
                        isSubmit !== 0 && this.options.showIco && state(m, "pending", "loading...", this.options.icoPosition);
                        t = false;
                    }
                } else {
                    //无效的规则
                    t = true;
                }
                if (t == false) {
                    break;
                }
            }
            m.data("state", t);
            isSubmit !== 0 && this.options.onCheck && this.options.onCheck.call(this, t);
            return t;
        },
        /*
		 * 验证表单的状态
		 * @action=true验证表单并标识信息 否则只返回表单是否通过的状态
		 */
        verify: function(action) {
            var self, item;
            action = action || 0;
            for (var i in this.rules) {
                if (this.check(i, action)) {
                    continue;
                } else {
                    this.options.onSubmitError && this.options.onSubmitError.call(this);
                    return false;
                }
            }
        },
        submit: function() {
            /*
			 * 表单提交
			 */
            var state;
            if (this.state || this.options.onBeforeSubmit && this.options.onBeforeSubmit.call(this) == false) {
                return false;
            }
            if (this.verify(true) == false) {
                return false;
            }
            this.state = true;
            var _onSubmit = this.options.onSubmit && this.options.onSubmit.call(this);
            if (this.options.ajaxSubmit) {
                this.ajaxSubmit();
                return false;
            }
            this.state = null;
            return _onSubmit;
        },
        reset: function() {
            //重置表单
            var form = this.form[0];
            this.item.forEach(function(item) {
                item.data("state", null);
            });
            if (form.tagName.toLowerCase() == "form") {
                form.reset();
            } else {
                this.form.find("input, textarea, select").filter(function() {
                    return this.type != "submit" && this.type != "button";
                }).val("");
            }
            this.form.find("span.nj_f_tip").remove();
        },
        ajaxSubmit: function() {
            //ajax提交表单
            var self = this, options = $.extend({
                url: this.form[0].action,
                data: this.form.serialize(),
                type: "post",
                dataType: "json",
                context: this
            }, this.options.ajaxSubmit), _success = options.success;
            options.success = function(json) {
                self.state = null;
                _success && _success.call(this, json);
            };
            //dataType:'jsonp'跨域提交 get使用jquery默认处理方式 post使用iframe提交
            if (options.dataType == "jsonp" && options.type == "post") {
                form.post(this.form, options);
            } else {
                $.ajax(options);
            }
        }
    };
    function getMessage(tip, method) {
        return tip || form.message[method] || "";
    }
    //****公共方法及属性*****//
    form.state = function(m, s, tip, position) {
        /*
		 * 对元素m标记其验证状态
		 * @m:对象
		 * @s:类别  'ok'/'error'/'pending'/'focus'(focus event)
		 * @tip:提示语
		 */
        tip = tip || "";
        var wrap, ico, t, offset, holder = m;
        if (m.data("replace")) {
            holder = m.data("replace");
            position = position || "append";
        }
        m.removeClass("error pending");
        holder.siblings(".nj_f_tip").remove().end().find(".nj_f_tip").remove();
        if (!s) {
            return;
        }
        position = position || "after";
        if (s == "error" || s == "pending") {
            m.addClass(s);
        }
        s = s == "pending" ? "loading" : s;
        offset = m.offset();
        wrap = $('<span class="nj_f_tip"><span class="tip_ico"></span><span class="tip_con">' + tip + "</span></span>");
        t = wrap.find("span.tip_ico");
        holder[position](wrap);
        s != "focus" && new ui.ico(t, {
            type: s
        });
        wrap.addClass("nj_f_" + s);
    };
    form.reg = {
        /*
		 * 常用规则
		 */
        isNull: function(val) {
            if (val.replace(/\s/g, "") != "") {
                return true;
            } else {
                return false;
            }
        },
        isEmail: function(val) {
            var p = /^\w+(?:[-+.']\w+)*@\w+(?:[-.]\w+)*\.\w+(?:[-.]\w+)*$/;
            if (p.test(val)) {
                return true;
            } else {
                return false;
            }
        },
        isQQ: function(val) {
            //qq
            var p = /^\s*[.0-9]{5,10}\s*$/;
            if (p.test(val)) {
                return true;
            } else {
                return false;
            }
        },
        isUrl: function(val) {
            //验证输入是否是合法url地址 可以包含中文\u2E80-\u9FFF
            if (typeof val != "string") {
                return false;
            }
            val = val.split(/[\?#]/)[0];
            var p = /^(?:http(?:s)?:\/\/)?([\w-]+\.)+[\w-]+(?:\/[\w\W]*)?$/;
            if (p.test(val)) {
                return true;
            } else {
                return false;
            }
        },
        isMobile: function(val) {
            //验证是否是合法的手机号码
            var p = /^(13[0-9]|14[0-9]|15[0-9]|18[0-9])[0-9]{8}$/;
            if (p.test(val)) {
                return true;
            } else {
                return false;
            }
        },
        isTel: function(val) {
            //验证是否是合法的座机号码
            var p = /^\d{2,5}?[-]?\d{5,8}([-]\d{0,1})?$/;
            if (p.test(val)) {
                return true;
            } else {
                return false;
            }
        },
        isTel400: function(val) {
            //验证是否是合法的400电话
            var p = /^(400)[-]?\d{3}[-]?\d{4}$/;
            if (p.test(val)) {
                return true;
            } else {
                return false;
            }
        },
        isIdcard: function(val) {
            //验证身份证号是否合法18位或17位带字母
            var p = /^[1-9]\d{5}[1-9]\d{3}((0\d)|(1[0-2]))(([0|1|2]\d)|3[0-1])\d{3}(?:\d|[a-zA-Z])$/;
            if (p.test(val)) {
                return true;
            } else {
                return false;
            }
        },
        specialCode: function(val) {
            //是否包含特殊字符
            if (!/^[\u4e00-\u9fa5\w]*$/.test(val)) {
                return false;
            } else {
                return true;
            }
        },
        /*
		 * 判断字符长度是否合法 或者 判断类似checkbox的个数(val为数字)
		 * @options:必选参数，{min:最小长度,max:最大长度,其中的大于或小于都包含等于}
		 */
        isLength: function(val, options) {
            if (!options) {
                return;
            }
            //计算字符个数，一个汉字计算为2个字符
            var strLength = function(a) {
                var L = 0;
                for (var i = 0; i < a.length; i++) {
                    if (/[\u4e00-\u9fa5]/.test(a.charAt(i))) {
                        L += 2;
                    } else {
                        L += 1;
                    }
                }
                return L;
            };
            var options = options, len = typeof val === "string" ? strLength(val) : typeof val === "number" ? val : 0, test = true;
            if (options.min) {
                if (len < options.min) {
                    test = false;
                }
            }
            if (options.max) {
                if (len > options.max) {
                    test = false;
                }
            }
            return test;
        },
        /*
	       	 验证输入是否是数字
	        @options:可选参数，{min:最小值,max:最大值,decimals:可以带几位小数,type:int整数}
	    */
        isNum: function(val, opt) {
            var opt = opt || {}, p, test = !isNaN(val);
            if (opt.decimals) {
                p = eval("/^-?\\d+(?:\\.\\d{1," + opt.decimals + "})?$/");
                test = p.test(val);
            }
            if ((opt.min || opt.min == 0) && val < opt.min) {
                test = false;
            }
            if ((opt.max || opt.max == 0) && val > opt.max) {
                test = false;
            }
            if (opt.type == "int" && val.indexOf(".") != -1) {
                test = false;
            }
            if (val.lastIndexOf(".") == val.length - 1) {
                test = false;
            }
            return test;
        },
        //ajax验证
        remote: function(val, param, element) {
            var T = this, data;
            param = param || {};
            if (param.beforeSend && param.beforeSend(element) == false) {
                return "pending";
            }
            data = param.data = param.data || {};
            if (typeof param.data == "function") {
                data = param.data.call(this) || {};
            }
            if (param["name"]) {
                data[param["name"]] = val;
            } else {
                data[element.attr("name")] = val;
            }
            var _success = param.success;
            $.ajax({
                url: param.url,
                type: param.type || "get",
                data: data,
                context: param.context,
                dataType: param.dataType || "json",
                success: function(json) {
                    //if(!json){return;}
                    //element.data( "remote", json );
                    _success && _success(json, element);
                    if (json && json.state == 1 || json.status == 1 || param.check && param.check(json)) {
                        //ok
                        element.data("state", true);
                        form.state(element, "ok", json.info || "", T.options && T.options.icoPosition);
                        param.callback && param.callback();
                        //用于submit 返回成功后继续submit操作
                        param.callback = null;
                    } else {
                        //error
                        element.data("state", false);
                        form.state(element, "error", json.info || element.data("tip"), T.options && T.options.icoPosition);
                    }
                }
            });
            return "pending";
        }
    };
    form.message = {
        isNull: "不能为空",
        isEmail: "邮箱格式错误",
        isQQ: "qq号码格式错误",
        isUrl: "url格式错误",
        isMobile: "手机号码格式错误"
    };
    /*填充表单数据*/
    form.fill = function(options) {
        options = options || {};
        var Form = $(options.form || document.forms[0]), data = options.data, i, item, type, value;
        if (!Form.length || $.type(data) != "object") {
            return;
        }
        for (i in data) {
            item = Form.find('[name="' + i + '"]');
            if (!item.length) {
                continue;
            }
            type = item[0].type;
            value = data[i];
            if (type == "text" || type == "hidden" || type == "textarea" && typeof value == "string") {
                item.val(value);
            } else if (type == "radio") {
                item.filter('[value="' + value + '"]').attr("checked", "checked");
            } else if (type == "checkbox" && $.type(value) == "array") {
                $.each(value, function(i, v) {
                    item.filter('[value="' + v + '"]').click();
                });
            }
        }
    };
    /*
	 * 格式化表单数据
	 * 主要针对非form对象 
	 * 本身就是form对象则直接返回form.serialize()
	 */
    form.parse = function(form, dataType) {
        if (!form || !form.length) {
            return;
        }
        var _form = form.find("form"), Form = form[0].tagName.toLowerCase() == "form" ? form : _form.length ? _form : null, data;
        dataType = dataType || "string";
        if (Form) {
            data = Form.serialize();
        } else {
            //Form = $('<form style="display:none"></form>').appendTo(document.body);
            //clone无法拷贝select值
            //Form.append(form.clone(true));
            //data = Form.serialize();
            //Form.remove();
            var item = form.find("input,textarea,select,button"), i = 0, n = item.length, data = {};
            for (;i < n; i++) {
                if (item[i].name) {
                    data[item[i].name] = item[i].value;
                }
            }
        }
        return data;
    };
    /*
	 * post跨域 使用iframe实现
	 */
    form.post = function(form, options) {
        options = options || {};
        var name = "iframe_" + +new Date(), iframe = $('<iframe src="" name="' + name + '" style="display:none"></iframe>').appendTo(document.body), callback = "jsoncallback_" + +new Date();
        if (form && form.length) {
            form[0].target = name;
            form[0].action = form[0].action.split("?")[0] + "?jsoncallback=" + callback;
            window[callback] = function(json) {
                options.complete && options.complete.call(options, json);
                options.success && options.success.call(options, json);
                delete window[callback];
                iframe.remove();
                iframe = null;
            };
            options.beforeSend && options.beforeSend.call(options);
            //document.domain = domain.host;//此句可以在beforeSend中配置
            form[0].submit();
        }
    };
    return form;
});
