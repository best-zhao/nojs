/**
 * nojs mvc
 * 2014-11-28
 */
define(function(require){
    
    var $ = require('$'),
        slice = Array.prototype.slice,
        validNode  = /{{\s*([\$\w\.\+\-\*\/\%\!:\?\d''""<>&\(\),\s=#]+)\s*}}/,
        validNodes = /{{\s*([\$\w\.\+\-\*\/\%\!:\?\d''""<>&\(\),\s=#]+)\s*}}/g;
    
    /**
     * 以model为单位 一个页面可存在多个 也可互相嵌套
     * 在页面中通过在tag中添加'nj-module="myModule"'来启动
     * 
     */
    
    //创建一个空函数
    var noopMethod = function(){
        return function(){};
    };

    /**
     * 解析语句
     * 支持语法：1.赋值计算和条件运算符 2.执行函数 其余语句过滤掉
     */
    function syntaxParse(str, scope){
        var model = scope.model,
            reStr = {},
            data = {
                //replaceStr : reStr,
                watchKey : [],
                methods : [],
                vars : []
            },
            watchKey = data.watchKey,
            methods = data.methods,
            vars = data.vars;


        //替换 字符串内容
        var skey = '_nj_str_', akey = 'nj_arg_', n = 0;
        str = str.replace(/"(?:\\"|[^"])*"|'(?:\\'|[^'])*'/g, function(a,b,c){
            if( a ){
                var key = skey+(++n);
                reStr[key] = a;
                return key;
            }
        })

        //替换 语句块
        str = str.replace(/\)\s*{[\w\W]*}/g, ')');

        //提取 方法名
        str.replace(/([\$\w\.\+\-\*\/\%\!:\?]+)\s*\(/g, function(a,b){

            methods.indexOf(b)<0 && methods.push(b);  
        })

        //提取 参数中的变量列表 并替换 所有()内容
        str = str.replace(/\(([\s\w\$\(\),\.\+\-\*\/\%\!:\?=]*)\)/g, function(a,b){
            //b(1,c,d(d1,d2))
            b = b.split(/[,\+\-\*\/\%\!:\?=]/);
            b.forEach(function(arg){
                arg = arg.replace(/^\(|\)$/, '');//替换掉收尾括号
                if( arg.indexOf('(')>0 ){//参数内容带有函数执行
                    arg = arg.split('(');
                    methods.indexOf(arg[0])<0 && methods.push(arg[0]);    
                    arg = arg[1];
                }
                //替换改变作用域的关键字 $parent.list>$parent.model.list
                // if( arg.indexOf('$parent')==0 ){
                //     a = a.replace('$parent.', '$parent.model.');
                // }                
                //console.log(arg, a, checkArgument(arg) && vars.indexOf(arg)<0);
                arg = $.trim(arg)
                checkArgument(arg) && vars.indexOf(arg)<0 && vars.push(arg) //&& console.log(arg);
            })

            var key = ';'+akey+(++n)+';';
            reStr[key] = a;
            return key;
        })
        


        //是否为有效的变量
        function checkArgument(arg){
            arg = $.trim(arg);
            if( !arg || reStr[arg] 
                || /^(\d+|this|return|true|false|var|for|delete)$/.test(arg) //数字或关键字
                || /^(\d|[^\w\$])/.test(arg) //非法变量名称
            ){
                return false;
            }else{
                return true;
            }
        }
        

        //分割并过滤语句 提取相关变量名
        str = str.split(';');

        var regCompute = /[\+\-\*\/%\!=\?:<>\s]/,       //包含运算符的
            validStr = /[\$\w\.\+\-\*\/%\!=\?:<>]+/,    //不一定包含运算符的
            keyword = /^(\$(?:parent|root)\.)/
        

        str.forEach(function(s, i){

            str[i] = s = $.trim(s);

            // if( keyword.test(s) ){//替换关键字
            //     str[i] = s.replace(keyword, '$1model.');
            // }
            
            //运算符语句匹配 a=b; a=a==1?2:1;            
            if( !s || reStr[';'+s+';'] || !validStr.test(s) ){
                return;
            }

            //console.log;nj_arg_1; 替换()后 这里变量匹配可能会出现重复
            if( methods.indexOf(s)>=0 && reStr[';'+str[i+1]+';'] ){
                return;
            }

            var computeVars = s.split(regCompute);
            computeVars.forEach(function(m){
                m = $.trim(m);
                checkArgument(m) && vars.indexOf(m)<0 && methods.indexOf(m)<0 && vars.push(m);
            })
            
        })
        // console.log(methods,vars)

        //初始化语句中未定义的变量及方法
        function initMethod(method, isFunction){
            if( method=='$key' ){
                return;
            }
            var Parent = model, 
                arr = method.split('.'), 
                key = arr[0], 
                last = $.trim(arr.slice(-1)[0]);

            //console.log(arr,watchKey,isFunction)
            //函数每次执行的时候需要监控的变量
            !isFunction && key && !/^(\$(?:key|data)\.)/.test(key+'.') && watchKey.indexOf(key)<0 && watchKey.push(key);
            
            //if( isFunction ){
                //全局对象下存在的函数
                if( Parent[key]===undefined && window[key]!==undefined ){
                    return;
                }

                // if( key=='$array' ){
                //     console.log(key)
                //     return
                // }
               
            //}
            var i=0, n=arr.length, m, _scope = scope, _i = 0;
            for( ; i<n; i++ ){
                m = $.trim(arr[i]);
                if( !m || /^true|false&/.test(m) ){//空字符串 或 关键字
                    break;
                }
                if( m=='$parent'||m=='$root' ){
                    //Parent = Parent[m].model;
                    _scope = Parent[m+'Scope'];
                    _i = i+1;
                    //continue;
                }
                if( Parent[m]!==undefined ){

                    //执行数组原生方法
                    //console.log(isFunction,m,Parent[m],$.type(Parent[m]))
                    if( isFunction && i==n-2 && Array.prototype[last] && $.type(Parent[m])=='array' ){
                        //console.log(arr,_i,n,_scope.subscriber);
                        var _key = arr.slice(_i, n-1).join('.');
                        _key = _key ? [_key] : [];

                        for( var j in _scope.subscriber ){//该数组及和该数组相关的key均需apply
                            if( j.indexOf(_key[0]+'.') == 0 ){
                                _key.push(j);
                            }
                        }
                        _key.length && watchKey.push({
                            scope : _scope,
                            key : _key
                        });
                        break;
                    }
                }else{
                    Parent[m] = (m==last&&!isFunction) ? undefined : noopMethod();
                }
                Parent = Parent[m];
            }
            //console.log(watchKey,method)
        }

        // console.log(methods,vars)
        
        methods.forEach(function(name){
            initMethod(name, true);
        })
        
        for( var i=0,n=vars.length,name; i<n; i++ ){
            name = vars[i] = vars[i].replace(/^this\./, '');
            if( !checkArgument(name) ){//过滤无效参数 
                vars.splice(i, 1);
                i--;
                n--;
                continue;
            }
            initMethod(name);
        }    

        str = str.join(';');
        //还原被替换的字符串
        for( var i in reStr ){
            str = str.replace(eval('/'+i+'/g'), reStr[i]);
        }

        data.str = str;

        //console.log(str,'\n',methods,vars);

        return data;
    }

    //初始化语法 对应到dom 
    //将格式化后的数据保存在dom中
    function syntaxInitialize(dom, str, scope){
        if( !dom || !str){
            return;
        }
        if( dom.$syntax ){
            return dom.$syntax;
        }
        return dom.$syntax = syntaxParse(str, scope);
    }

    //获取全部子节点 包括文本节点
    //支持单个节点或者一组节点Array
    function getAllChildren(node, options){
        options = options || {};
        
        var children = [];
        if( !node ){
            return children;
        }

        options.andSelf && push(node);

        function each(nodes){
            
            if( !nodes || !nodes.length ){
                return;
            }
            
            var node, i=0, n = nodes.length;

            for( ; i<n; i++ ){
                node = nodes[i];
                push(node);
                node && node.nodeType==1 && each(node.childNodes);
            }
        }
        each($.type(node)=='array' ? node : node.childNodes);

        function push(node){
            if( options.filter ){
                var filerNodes = options.filter(node);
                if( filerNodes ){
                    children = children.concat(filerNodes);
                }
            }else{
                children.push(node);
            }
        }
        return children;
    }

    //获取node中有效的订阅子节点及属性节点   

    /**
     * 创建一个module
     */
    function Module(el, model, options){
        this.element = el;
        //console.log(typeof el)
        var $el = $(el);//转化为jQuery对象时会丢失文本节点
        //this.model = model || {};
        this.options = options = options || {};
        this.models = [];
        
        this.subscriber = {};
        
        var self = this,
            _model = model,
            modelType = $.type(model);
        
        if( typeof model != 'function' ){

            model = function(){
                this.$data = _model;
                this.$key = options.$key;
                //this.$array = options.$array;

                if( modelType == 'object' ){
                    for( var i in _model ){
                        this[i] = _model[i];
                    }
                }
            }
        }
        //model.prototype.$parent = this.options.$parent || this;
        model.prototype.$set = function(key, value) {
            
            var parent = this, i=0,  _key = key.split('.'), n=_key.length, name = _key.slice(-1)[0];
            for( ; i<n-1; i++ ){
                if( !parent ){
                    return;
                }
                parent = parent[_key[i]];
            }
            //a.b.c 这里的c可能为一个函数 需要不同处理
            if( typeof parent[name]=='function' ){

                //函数可能存在多个参数 从$set的第二个参数开始均为其参数
                var args = slice.call(arguments, 1, arguments.length);


                if( $.type(parent)=='array' ){
                    Array.prototype[name].apply(parent, args);
                }else{
                    parent[name].apply(null, args);
                }
                self.apply(_key.splice(0, n-1).join('.'));
                return;
            }else{
                // var v = value, type = typeof value;

                // if( type=='string' ){
                //     v = '"'+value+'"';
                // }else if( type=='object' ){
                //     v = JSON.stringify(value)
                // }

                // var $$str = name+'='+v;
                // with(parent){
                //     eval($$str);
                // }
                parent[name] = value
            }
            self.apply(key);
        }

        this.model = new model(this);
        var parent = this.options.$parent || this;
        this.model.$parent = parent.model;
        this.model.$parentScope = parent;

        this.domID = {};
        
        /**
         * [nj-item="*"]声明一个变量 并实现双向绑定
         * 一般为表单元素 （用户可输入的）匹配其value/checked值
         */
        var items = $el.find('[nj-item]');
        items.each(function(){
            self.models.push(self.createModel(this));
        })
        
        /**
         * "a='b'+ c +1"
         * "a.b(1+1,c,d(d1,d2))?'show':'hide'"
         * "slide(1,2);isopen=isopen=='d_hide'?'d_show':'d_hide'"
         *
         * 
         */
        //console.log(syntaxParse("name", this.model))

        /**
         * [nj-click="*"]绑定click事件
         * 
         */
        var clicks = $el.find('[nj-click]');
        
        clicks.each(function(){
            
            var str = $(this).attr('nj-click');
            
            this.onclick = function(e){
                var data = syntaxInitialize(this, str, self),
                    watchKey = data.watchKey;

                self.model.$event = e;

                with(self.model){
                    try{
                        eval(this.$syntax.str);
                    }catch(e){
                        throw Error(e);
                    }
                };
                console.log(data.methods, watchKey)
                // watchKey.forEach(function(key){
                //     self.apply(key);
                // })
                watchKey.forEach(function(item){
                    if( typeof item=='string' ){//for vars
                        self.apply(item);
                        return;
                    }
                    var scope = item.scope;
                    item.key.forEach(function(key){
                        scope.apply(key);
                    })
                })
                e.preventDefault()
            };
        })
        this.getSubscriber(el);
        //console.log(this.subscriber)
        for( var i in this.subscriber ){
            //var node = this.subscriber[i][0];
            this.apply(i);
        }
    }
    Module.prototype = {
        createModel : function(el){
            if( el.$modelBind ){
                return;
            }
            var self = this,
            tagName = el.tagName.toLowerCase(),
            isFormElement = /input|select|textarea/.test(tagName),
            key = $(el).attr('nj-item'),
            id = (+new Date),
            model = {
                id : id,
                element : el,
                key : key
            };
            el.$modelBind = 1;
            
            //this.model[key] = typeof this.model[key]=='undefined' ? '' : this.model[key];
            this.domID[id] = el;
            
            if( isFormElement ){
                
                //el本身也是订阅者
                this.pushSubscriber(el, key, {
                    /*
                     * 全部替换value值 
                     * 如value="name:{{name}}" 会替换整个value值
                     * 因为这里是双向绑定 否则只替换{{name}}
                     */
                    writeAll : true
                });
                el.$scope = this.model;   

                var checkbox = el.type=='checkbox',
                    selectNode = /^select/.test(el.type),
                    eventName = checkbox||selectNode ? 'change' : 'keydown',
                    _key = key,
                    $$str;  
                
                if( el.type=='radio' ){//设置选中的radio默认值
                    if( el.checked ){
                        // $$str = _key+'="'+el.value+'"';
                        // with(self.model){
                        //     eval($$str);
                        // }
                        new Function('a','b','a.'+_key+'=b')(self.model,el.value);
                    }
                    eventName = 'change';                   
                }else if( selectNode ){//select默认值
                    
                    var selectVal = el.value || el.options[0].value;
                    el.value = selectVal;                    
                    new Function('a','b','a.'+_key+'=b')(self.model,selectVal);
                }
                $(el).on(eventName, function(){
                    var v = this

                    setTimeout(function(){
                        var val = v[checkbox ? 'checked' : 'value'],
                            $$str = checkbox ? (_key+'='+val) : (_key+'="'+val.replace(/\\/g,'\\\\')+'"');

                        //同步关联select selectedOptions对象
                        if( selectNode ){
                            var selected = slice.call(v.selectedOptions, 0).map(function(option){
                                return option.$data || option.value;
                            })
                            $$str = _key+'='+JSON.stringify(v.multiple?selected:selected[0]);

                            // var $selectedOptions = slice.call(v.selectedOptions, 0).map(function(option){
                            //     //var index = option.index - v.$startIndex;
                            //     return option.index;
                            // });
                            // with(self.model){
                            //     eval(v.$selectedKey+'=['+$selectedOptions+']');
                            // }
                        }

                        with(self.model){
                            eval($$str);
                            if( self.model.$data ){
                                $data[_key] = val;
                            }
                        }
                        //参数2：手动输入时 不用更新当前对象
                        self.apply(key, v);
                    }, 0)
                })
            }
            return model;
        },
        //获取订阅者
        getSubscriber : function(element, model){
            element = element || this.element;
            model = model || this.model;

            var self = this,
            //subScope = model===this.model ? this.subscriber : this.subscriberArray,

            subNodes = getAllChildren(element, {
                filter : function(node){
                    return self.getValidSubscribe(node);
                }
            });
            
            //console.log(element)

            subNodes.forEach(function(node){
                var keys = [], 
                    value = node.value || node.nodeValue;

                //一个节点可能关联多个变量 
                //提取出表达式存放在key中     
                value.replace(validNodes, function(a,b){
                    b && keys.indexOf(b)<0 && keys.push(b);
                });
                self.pushSubscriber(node, keys); 

                node.$scope = model;
            })
            
        },
        getValidSubscribe : function(node){
            if( !node ){
                return [];
            }
            var self = this,
                subNodes = [], 
                type = node.nodeType,
                elementNode = type==1;//元素节点

            if( node.$filter || elementNode && /script|style/.test(node.tagName.toLowerCase()) ){
                return subNodes;
            }
            //console.log(node.nodeType,node)

            //ie bug: 文本节点不支持自定义属性 
            node.$filter = 1;

            
            if( type==1 ){

                var njEach = elementNode && node.getAttribute('nj-each');

                if( njEach ){
                    var eachData = /^\s*([\$\w\|\s:]+)\s*$/.exec(njEach);
                    

                    if( !eachData ){
                        return subNodes;
                    }
                    eachData = eachData[1].split('|');
                    eachData.forEach(function(e,i){
                        eachData[i] = e = $.trim(e);
                        if( !e ){
                            eachData.splice(i,1);
                        }
                    })

                    var options = eachData.slice(1, eachData.length).join(',');
                    if( options ){
                        // var selectedKey = /(?:^|[,\|])selected\s*:\s*([\w\$]+)/.exec(options);
                        // selectedKey = selectedKey && selectedKey[1];

                        var $$options = '({'+options+'})';

                        with(this.model){
                            try{
                                $$options =  eval($$options);
                            }catch(e){
                                throw Error(e);
                            }
                        }
                        //console.log($$options,this.model)
                        options = $$options;

                        //select下拉菜单的 选中项
                        // if( options.selected && selectedKey ){
                        //     node.$selected = selectedKey;//this.apply(key) 中 对比 node.$selected==key表示selectedOptions更新

                        //     this.pushSubscriber(node, selectedKey); 

                        //     //option循环 select自动双向绑定 关联selectedOptions
                        //     var tagName = node.tagName.toLowerCase();

                        //     if( tagName=='option' || tagName=='optgroup' || tagName=='select' ){
                        //         var selectNode = tagName!='select' ? node.parentNode : node;//select element
                                
                        //         //用于select change事件中更新selectedOptions对象
                        //         selectNode.$selectedOptions = options.selected;
                        //         selectNode.$selectedKey = selectedKey;

                        //         //当option repeat自身时 可能存在循环体之外的option
                        //         var startIndex = tagName!='select' && options.repeat ? node.index : 0;
                        //         //console.log(startIndex);
                        //         //selectNode.$startIndex = startIndex

                        //         //将select元素添加为双向绑定对象 
                        //         //self.createModel(selectNode);
                        //         //console.log(selectNode)
                        //     }
                        // }
                    }
                    options = options || {};


                    //将其子元素拷贝一份作为each模板
                    var templete = options.repeat ? [node] : slice.call(node.childNodes, 0),
                        notes = document.createComment(eachData[0]+' each');    
                    templete.push(notes);

                    //将其内部所有元素标记 $filter                    
                    getAllChildren(node).forEach(function(n){
                        n.$filter = 1;
                    })

                    node.$each = {
                        templete : templete,
                        options : options,
                        parentNode : node.parentNode,
                        nextSibling : node.nextSibling,
                        //保存子模型 new Module()
                        models : []
                    }
                    self.pushSubscriber(node, eachData[0]);

                    
                    if( options.repeat ){//循环节点本身 本身作为模板
                        node.parentNode.removeChild(node);
                        node.removeAttribute('nj-each');
                        
                        return subNodes;
                    }else{
                        node.innerHTML = '';
                    }
                }

                //获取属性节点
                var _attrs = node.attributes, attrs = [], n = _attrs.length, i;
                if( n ){
                    //slice.call(node.attributes, 0) ie报错
                    for( i=0; i<n; i++ ){
                        attrs.push(_attrs[i]);
                    }
                    
                    attrs.forEach(function(n){
                        if( validNode.test(n.value) ){

                            n.$parentElement = node;//记录属性节点所在的元素节点
                            subNodes.push(n);
                        } 
                    })
                }
                

            }else if( type==3 ){//满足条件的文本节点

                var html = $.trim(node.nodeValue);
                if( validNode.test(html) ){

                    //textarea手动修改内容后 子节点会被替换 所以其包含的文本节点不用添加 直接添加textarea节点本身
                    //<textarea>{{name}}+abc</textarea>
                    if( node.parentNode.type=='textarea' ){
                        node = node.parentNode;
                    }

                    subNodes.push(node);
                }
            }
            
            return subNodes;
        },
        //保存获取到的订阅者
        //key: {{key}} 多个key为数组
        //@subScope : 数组单独保存一个对象this.subscriberArray 默认this.subscriber
        pushSubscriber : function(node, key, data, subScope){
            if( !key ){
                return
            }
            var self = this, 
                value = node.value || node.nodeValue, 
                _key = key, 
                keyType = $.type(key),
                rKey = /^\$(data|parent|root)\./;

            subScope = subScope || this.subscriber;

            if( keyType=='string' || data && data.writeAll ){
                push(key, 'string');
                return;
            }

            //将关联多个变量的引用组合成一条语句进行分析
            if( $.type(key)=='array' ){
                key = key.join(';');
            }
           
            //提取相关变量及方法
            var d = syntaxInitialize(node, key, this),
                vars = d ? d.vars : [],
                methods = d ? d.methods : [];

            vars.forEach(push,'vars');
            

            //需要分析这些方法函数中涉及的相关变量 即依赖属性
            methods.forEach(function(k){
                var fnStr, $$k = k;
                
                with(self.model){
                    fnStr = eval($$k);
                }

                if( typeof fnStr != 'function' ){
                    return;
                }
                fnStr = fnStr.toString();
                
                //原生函数
                if( /^function[\s\w\(\)]+{ \[native code\] }/.test(fnStr) ){
                    return;
                }

                fnStr = fnStr.replace(/(?:^function\s*\([^\)]*\){)|(?:}$)/g, '');
                fnStr = $.trim(fnStr).replace(/[\r\n]/g, ';');

                var vars = syntaxParse(fnStr, self).vars;
                
                vars.forEach(function(k){
                    push(k,'methods')
                })
            });

            function push(k){
                //替换一些特殊的关键字 $data.name 实际上是订阅的name属性
                var _k = k;

                k.replace(rKey, function(a,b){
                    if( b=='parent' ){

                        //该节点访问的是父级 所以将其添加到父对象的订阅列表中
                        self.options.$parent.pushSubscriber(node, k.replace(rKey, ''));
                    }
                    //return '';
                });

                subScope[k] = subScope[k] || [];
                
                data = $.extend({
                    node : node,

                    //保存原文本
                    value : value,

                    //提取的表达式
                    //expressions  : keyType=='array' ? _key : [key],
                    
                    vars : vars || [k]
                },data)
                subScope[k].push(data);
            }
        },
        //notApply：需要过滤的元素
        apply : function(key, notApply){
            
            if( !key || !this.model ){//this.model = new model()执行构造函数时 若函数里存在$set操作 此时this.model还未赋值
                return;
            }
            var self = this,
                subscriber = this.subscriber[key] || [],
                value = this.model[key],
                $$key = key;

            // with(this.model){

            //     value = eval('typeof '+$$key)=='undefined' ? undefined : eval($$key);
            // }
            value = new Function('a','return a.'+key)(this.model);
            console.log(key,value,this.model)
            
            var valueType = $.type(value),
                //数组或关联数组监控对象
                observableArray = /array|object/.test(valueType),
                _key = key.split('.');

            //a.b为a.b.c的上级 上级更新 其所有下级也要同时更新
            for( var i in this.subscriber ){
                if( i.indexOf(key+'.')==0 ){
                    this.apply(i);
                }
            }

            if( !subscriber.length ){
                return;
            }
            // console.log(key,subscriber)

            //数组子项发生变化时 需更新数组本身 一般为用户表单输入数据
            if( this.model.$key!==undefined && this.model.$parentScope!==this && key.indexOf('$')<0 && notApply ){
                //console.log(observableArray,key, this.model.$parent.list[0], notApply)
                this.model.$parentScope.apply(this.options.$arrayName, notApply);
            }

            //监控数组发生变化时
            // if( key=='$array' && observableArray && !subscriber.length ){
            //     //console.log(this.model.$parentScope.subscriber[this.options.$arrayName])
            //     this.model.$parentScope.apply(this.options.$arrayName)
            //     return;
            // }

            //遍历所有订阅该属性的节点
            subscriber.forEach(function(item){
                var node = item.node;

                if( node===notApply || node.type=='radio' ){
                    return;
                }
                if( /^select/.test(node.type) ){
                    self.defaultSelected(node);//设置select默认选中项
                    return;
                }

                if( observableArray && node.$each ){
                    self.applyArray(node, key);//更新each数组
                    return;
                }

                var type = node.nodeType;
                
                if( item.writeAll ){
                    node.value = value;

                }else{
                    var text = item.value || node.value, 
                        reg;

                    if( !text ){
                        return;
                    }

                    var $val
                    //该节点可能订阅多个相同或不同的属性 所以分批替换
                    text.replace(validNodes, function(a,b){
                        var scope = node.$scope || self.model;
                        
                        //部分关键字可改变作用域 $data $parent $root
                        //b = b.replace('$parent.', '$parent.model.');
                        //text = text.replace('$parent.', '$parent.model.');
                        //console.log(node,b,scope,key)

                        reg = eval('/{{\\s*'+b.replace(/([\$\.\/\+\-\*\/\%\?:\(\),])/g, '\\$1')+'\\s*}}/g');
                        with(scope){
                            $val = eval(b);
                            try{
                                
                            }catch(e){

                            }
                        }
                        
                        if( $val!==undefined ){
                            text = text.replace(reg, $val);
                        }
                        //console.log('value:'+$val,reg, text)
                    })

                    //属性节点中checked disabled readonly单独处理
                    if( type==2 ){
                        var attrName = node.name, parentNode;
                        if( /checked|disabled|readonly|multiple|selected/.test(attrName) ){
                            parentNode = node.$parentElement //|| node.ownerElement;
                            //这里不能通过ownerElement获取文本节点所在元素节点 removeAttribute会移除原本的文本节点
                            parentNode[$val?'setAttribute':'removeAttribute'](attrName, attrName);
                            return;
                        }
                    }
                    node[type==1||type==2?'value':'nodeValue'] = text;
                }               
            })
            
        },
        applyArray : function(node, key){
            if( !node.$each ){
                return;
            }
            var self = this,
                eachData = node.$each,

                //主要为了区分options.repeat 循环节点本身需要使用其父节点进行相关节点操作
                nodeSelf = node,
                selectNode,

                array = self.model[key],
                dataType = $.type(array),
                templete = eachData.templete,
                modelsLen = eachData.models.length,
                arrayModel;


            if( eachData.options.repeat ){
                nodeSelf = eachData.parentNode;
            }
            if( /^select|optgroup|option/.test(node.tagName.toLowerCase()) && nodeSelf.type ){
                selectNode = nodeSelf;
            }

            if( modelsLen ){
                if( dataType=='object' ){//关联数组
                    var key, hasKeys = [];
                    for( var i=0; i<modelsLen; i++ ){
                        arrayModel = eachData.models[i];
                        key = arrayModel.model.$key;

                        if( array[key]===undefined ){
                            eachData.models.splice(i, 1);
                            var el = arrayModel.element;
                            el.forEach(function(n){
                                nodeSelf.removeChild(n);
                            })
                            i--;
                            modelsLen--;
                            continue;
                        }
                        hasKeys.push(key);
                    }
                    for( var i in array ){
                        if( hasKeys.indexOf(i)<0 ){//新增
                            var frag = document.createDocumentFragment();
                            addArray(array[i], i, frag);
                            nodeSelf.insertBefore(frag, node.childNodes[templete.length*modelsLen]);
                        }
                    }
                    selectNode && self.defaultSelected(selectNode);
                    return;
                }

                //标准数组
                var isAdd = array.length > modelsLen,//数组是增加还是减少
                    len = Math.max(array.length, modelsLen);

                for( var i=0; i<len; i++ ){
                    arrayModel = eachData.models[i];
                    if( !arrayModel ) {//push
                        var frag = document.createDocumentFragment();
                        addArray(array[i], i, frag);
                        arrayModel = eachData.models[i-1];//添加元素到上一个元素组的最后一个节点后面
                        
                        var last = arrayModel.element[arrayModel.element.length-1];
                        if( last.nextSibling ){
                            nodeSelf.insertBefore(frag, last.nextSibling);
                        }else{
                            nodeSelf.appendChild(frag);
                        }
                        continue;
                    }
                    if( arrayModel.model.$key != i ){//更新$key
                        arrayModel.model.$key = i;
                        arrayModel.apply('$key');
                    }

                    if( arrayModel.model.$data !== array[i] ){
                        if( isAdd ){//unshift
                            var frag = document.createDocumentFragment();
                            addArray(array[i], i, frag);
                            nodeSelf.insertBefore(frag, arrayModel.element[0]);
                        }else{
                            eachData.models.splice(i, 1);
                            var el = arrayModel.element;
                            el.forEach(function(n){
                                nodeSelf.removeChild(n);
                            })
                            i--;
                            len--;
                            //arrayModel = null;
                        }
                        
                    }else{
                        //内部属性可能发生变化
                        //arrayModel.model.$data = array[i];
                        if( $.type(array[i])=='object' ){
                            for(var j in array[i] ){
                                arrayModel.model[j] = array[i][j];
                            }
                        }
                        for( var q in arrayModel.subscriber ){
                            arrayModel.apply(q);
                        }
                    }
                }
                selectNode && self.defaultSelected(selectNode);
                return;
            }


            var frag = document.createDocumentFragment();
            
            //遍历数组
            for( var i in array ){
                addArray(array[i], i, frag);
            }

            if( eachData.options.repeat ){
                
                if( eachData.nextSibling ){
                    nodeSelf.insertBefore(frag, eachData.nextSibling);
                }else{
                    nodeSelf.appendChild(frag);
                }
            }else{
                node.appendChild(frag);
            }
            
            selectNode && self.defaultSelected(selectNode);

            function addArray(data, i, frag){
                //获取该组所有节点及子节点
                var groupNodes = [];

                templete.forEach(function(n){
                    //从模板节点中拷贝 一份
                    var node = n.cloneNode(true);
                    frag.appendChild(node);
                    groupNodes.push(node);

                    if( node.nodeType==1 && node.tagName.toLowerCase()=='option' ){
                        node.$data = data;
                    }
                    
                })

                eachData.models.splice(dataType=='array'?i:eachData.models.length, 0, new Module(groupNodes, data , {
                    $key : dataType=='array' ? parseInt(i) : i,
                    //关联父对象
                    $parent : self,
                    //$array : array,
                    $arrayName : key
                }))
            }

        },

        //设置select默认选中值
        defaultSelected : function(node){
                      
            var $$sel = node.getAttribute('nj-item');
            with(this.model){
                $$sel = eval('typeof '+$$sel)=='undefined' ? undefined : eval($$sel);
            }
            if( !$$sel ){
                return;
            } 

            var selected = $.type($$sel)=='array' ? $$sel : [$$sel];

            slice.call(node.options, 0).forEach(function(option){
                if( option.$data ){
                    option.selected = selected.indexOf(option.$data)>=0 && true;
                }
            })           
        }
    }
    
    // $(function(){
    //     var modules = $(document.body).find('[nj-module]');
    //     modules.each(function(){
    //         //new Module(this);
    //     })
    // })
    
    return {
        module : function(name, model){
            var el = $(document.body).find('[nj-module="'+name+'"]')[0];
            return new Module(el, model).model;
        }
    }
})