/**
 * nojs mvc
 * 2014-11-28
 */
define(function(require){
    
    var $ = require('$'),
        slice = Array.prototype.slice,
        validNode  = /{{\s*([\w\W]+?)\s*}}/,
        validNodes = /{{\s*([\w\W]+?)\s*}}/g,
        $keywords = ['this','return','true','false','var','for','delete','function','if'],
        ie8 = $.browser.msie && parseInt($.browser.version)<=8;
    
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
                watchKey : [],
                methods : [],
                vars : []
            },
            watchKey = data.watchKey,
            methods = data.methods,
            vars = data.vars;

        str.replace(/"(?:\\"|[^"])*"|'(?:\\'|[^'])*'|\/(?:\\\/|[^\/\r\n])+\/(?=[^\/])|((?:\$|\b)[\$\w\.]+)\b(\(?)/g, function(a,b,c){
            if( c ){
                checkArgument(b) && methods.indexOf(b)<0 && methods.push(b);
            }else if( b ){
                checkArgument(b) && vars.indexOf(b)<0 && vars.push(b);
            }
        })

        //替换 字符串内容
        // var skey = '_nj_str_', akey = 'nj_arg_', n = 0;
        // str = str.replace(/("(?:\\"|[^"])*"|'(?:\\'|[^'])*')/g, function(a,b){
        //     if( b ){
        //         var key = skey+(++n);
        //         reStr[key] = b;
        //         return key;
        //     }
        // })

        // //替换 语句块
        // str = str.replace(/\)\s*{[\w\W]*}/g, ')');

        // //替换 [] 中的属性引用
        // str = str.replace(/(\[[\$\w]+\])/g, '');

        // //提取 方法名
        // str.replace(/([\$\w\.]+)\s*\(/g, function(a,b){
        //     checkArgument(b) && methods.indexOf(b)<0 && methods.push(b);  
        // })


        //提取 参数中的变量列表 并替换 所有()内容
        // str = str.replace(/\(([\s\w\$\(\),\.\+\-\*\/\%\!:\?=<>]*)\)/g, function(a,b){
        //     //b(1,c,d(d1,d2))
        //     b = b.split(/[,\+\-\*\/\%\!:\?=]/);
        //     b.forEach(function(arg){
        //         arg = arg.replace(/^\(|\)$/, '');//替换掉收尾括号
        //         if( arg.indexOf('(')>0 ){//参数内容带有函数执行
        //             arg = arg.split('(');
        //             methods.indexOf(arg[0])<0 && methods.push(arg[0]);    
        //             arg = arg[1];
        //         }
        //         //替换改变作用域的关键字 $parent.list>$parent.model.list
        //         // if( arg.indexOf('$parent')==0 ){
        //         //     a = a.replace('$parent.', '$parent.model.');
        //         // }                
        //         //console.log(arg, a, checkArgument(arg) && vars.indexOf(arg)<0);
        //         arg = $.trim(arg)
        //         checkArgument(arg) && vars.indexOf(arg)<0 && vars.push(arg) //&& console.log(arg);
        //     })

        //     var key = ';'+akey+(++n)+';';
        //     reStr[key] = a;
        //     return key;
        // })
        

        //是否为有效的变量
        function checkArgument(arg){
            arg = $.trim(arg);
            if( !arg || $keywords.indexOf(arg)>=0
                || /^(\d|[^\w\$])/.test(arg) //非法变量名称
            ){
                return false;
            }else{
                return true;
            }
        }

        //初始化语句中未定义的变量及方法
        function hasSameKey(key, scope){
            var state;
            watchKey.forEach(function(k){
                if( k.key==key && k.scope==scope ){
                    state = true;
                }
            })
            return state;
        }
        function initMethod(method, isFunction){
            if( method=='$key' ){
                return;
            }
            var Parent = model, 
                arr = method.split('.'), 
                key = arr[0], 
                last = $.trim(arr.slice(-1)[0]),
                _key, _scope = scope;

            //函数每次执行的时候需要监控的变量
            if( !isFunction && key && !/^(\$(?:key|data)\.)/.test(key+'.') ){
                if( method.indexOf('$parent.')==0 ){
                    _key = arr.slice(1,arr.length).join('.');
                    _scope = model.$parentScope
                }else{
                    _key = key;
                }
                
                if( !hasSameKey(_key, _scope) ){
                    watchKey.push({
                        key : _key,
                        scope : _scope
                    });
                }
                
            }
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
            var i=0, n=arr.length, m, _i = 0;
            _scope = scope;
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
                if( Parent[m] !== undefined ){

                    //执行数组原生方法
                    // console.log(isFunction,m,Parent[m],$.type(Parent[m]),i,n)
                    if( isFunction && i==n-2 && Array.prototype[last] && $.type(Parent[m])=='array' ){
                        
                        _key = arr.slice(_i, n-1).join('.');
                        // console.log(arr,_i,n,_key);
                        if( _key && !hasSameKey(_key, _scope) ){                            
                            watchKey.push({
                                scope : _scope,
                                key : _key
                            });
                            break;
                        }                        
                    }
                }else{
                    Parent[m] = (m==last&&!isFunction) ? undefined : noopMethod();
                }
                Parent = Parent[m];
            }
            //console.log(watchKey,method)
        }

        methods.forEach(function(name){
            initMethod(name, true);
        })
           
        vars.forEach(function(v){
            initMethod(v);
        })

        // console.log('str: '+str, methods, vars, watchKey)

        return data;
    }

    //初始化语法 对应到dom 
    //将格式化后的数据保存在dom中
    function syntaxInitialize(dom, str, scope){
        if( !dom || !str){
            return;
        }
        var data = $data(dom, '$syntax');
        if( data ){
            return data;
        }
        data = syntaxParse(str, scope);
        $data(dom, '$syntax', data);
        return data;
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

    //ie bug  
    //get/set node节点上的数据 ie8不支持直接在非元素节点上添加数据 使用$data.cache保存数据
    function $data(node, key, value){
        if( typeof value == 'undefined' ){
            return ie8 ? $data.get(node, key) : node[key];
        }else{
            if( ie8 ){
                $data.set(node, key, value);
            }else{
                node[key] = value;
            }
        }
    }
    $data.cache = {};
    $data.set = function(node, key, value){
        var k = (+new Date)+''+parseInt(Math.random()*10000);

        $data.cache[k] = {
            node : node,
            key : key,
            value : value
        }
    }
    $data.get = function(node, key){

        for( var i in $data.cache ){
            if( $data.cache[i].node===node && $data.cache[i].key===key ){
                return $data.cache[i].value;
            }
        }
    }

    //ie bug
    //将节点集合转为为标准数组
    function nodeToArray(nodes){
        return ie8 ? (function(){
            var arr = [], i=0,n = nodes.length;
            for( ;i<n;i++ ){
                arr.push(nodes[i]);
            }
            return arr;
        })() : slice.call(nodes, 0)
    }

    //ie bug :部分属性节点无法直接绑定语法 ie会视为无效属性 使用nj-attr来代替
    //checked|disabled|readonly|multiple|selected
    var $specialAttrs = ['href', 'style', 'checked', 'disabled', 'readonly', 'multiple', 'selected'];

    //获取model属性'a.b'
    function getAttribute(model, key, _global){
        _global = _global===false ? false : true;//model获取失败 是否从取window对象取属性
        var fn = [
            'var value;',
            'try{',
                'value = a.'+key,
            '}catch(e){',
                'if(b){ value = window.'+key+' }',
            '}',
            'return value;'
        ].join('');
        //console.log(key)
        return new Function('a','b', fn)(model, _global);
    }

    /**
     * 获取函数中相关变量
     */
    function getFnVars(fn){
        var arr = []
        if( typeof fn != 'function' ){
            return arr;
        }
        var fnStr = fn.toString();
        
        //原生函数
        if( /^function[\s\w\(\)]+{[\s\n]*\[native code\][\s\n]*}/.test(fnStr) ){
            return arr;
        }
        
        fnStr = fnStr.replace(/(?:^function\s*\([^\)]*\){)|(?:}$)/g, '');
        // 匹配 $scope.a.b
        fnStr.replace(/"(?:\\"|[^"])*"|'(?:\\'|[^'])*'|\/\*[\S\s]*?\*\/|\/(?:\\\/|[^\/\r\n])+\/(?=[^\/])|\/\/.*|[^\w]\$scope\.([\$\w\.]+)\b/g, function(a,b,c){
            b && arr.indexOf(b)<0 && arr.push(b);
        })
        // console.log(arr)
        return arr
    }

    /**
     * 比较2个对象内部属性是否相同 
     */
    function getDifferents(newObj, oldObj, dataType){
        var type = dataType || $.type(newObj),
            data = {state:true, items:[]},
            isArray;

        //普通数据类型
        if( type != 'array' && type != 'object' || newObj===null || newObj===undefined ){
            data.state = newObj === oldObj;
            return data;
        }

        if(  $.type(oldObj) != type ){
            return data;
        }

        var i, m1, m2, key, _data;
        for( i in newObj ){
            key = i;
            m1 = newObj[i];
            m2 = oldObj[i];
            type = $.type(m1);

            if( type=='function' ){
                continue;
            }

            if( /array|object/.test(type) ){//array|object
                isArray = type == 'array';
                if( isArray && m1.length!=m2.length ){
                    data.state = false;
                    data.items.push(key);
                    continue;
                }
                key = isArray ? '' : i+'.';

                _data = getDifferents(m1, m2, type);
                
                //console.log(_data,_data.items)

                //只写入不相同时的状态
                if( !_data.state ){
                    data.state = false;
                    _data.items.forEach(function(k){
                        data.items.push(key+k);
                    })
                }
            }else if( m1!==m2 ){//string|number|boolean
                data.state = false;
                data.items.push(key);
            }
        }

        return data;
    }

    //var d1 = {x:{a:1},y:{b:1},z:[1,2]},d2 = {x:{a:1},y:{b:2},z:[1,2,3]}
    // console.log(getDifferents(1,[]))

    /**
     * 创建一个module
     */
    function Module(el, model, options){
        this.element = el;
        
        var $el = $(el);//转化为jQuery对象时会丢失文本节点
        this.options = options = options || {};
        
        this.subscriber = {};

        this.cache = {};
        this.cacheTimer = null;
        
        var self = this,
            _model = model,
            modelType = $.type(model),
            Model;
        
        if( typeof model != 'function' ){

            Model = function(){
                this.$data = _model;
                this.$key = options.$key;
                //this.$array = options.$array;

                if( modelType == 'object' ){
                    for( var i in _model ){
                        this[i] = _model[i];
                    }
                }
            }
        }else{
            Model = function(){
                model(this);
            }
        }
        Model.prototype.$set = function(key, value) {
            
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

        this.model = new Model(this);
        var parent = this.options.$parent || this;
        this.model.$parent = parent.model;
        this.model.$parentScope = parent;
        
        /**
         * "a='b'+ c +1"
         * "a.b(1+1,c,d(d1,d2))?'show':'hide'"
         * "slide(1,2);isopen=isopen=='d_hide'?'d_show':'d_hide'"
         *
         * 
         */
        // console.log(syntaxParse("list1.push(1);slide(1,2);isopen=isopen=='d_hide'?'d_show':'d_hide'", this))

        /**
         * [nj-click="*"]绑定click事件
         * 
         */
        var clicks = $el.find('[nj-click]');
        
        clicks.each(function(){
            
            var str = $(this).attr('nj-click');
            
            this.onclick = function(e){
                e = e || window.event;
                var $$data = syntaxInitialize(this, str, self),
                    watchKey = $$data.watchKey;

                self.model.$event = e;

                with(self.model){
                    eval('('+str+')');
                    try{
                        
                    }catch(e){
                        //throw Error(e);
                    }
                };

                var keys = watchKey.map(function(k){
                    return k.key;
                })
                // console.log($$data.methods, watchKey, keys)

                //从执行的方法列表中提取相关联的属性名称
                $$data.methods.forEach(function(m){

                    //这里需注意所执行方法所在的作用域是否与这里相同
                    var scope = m.indexOf('$parent.')==0 ? self.model.$parentScope : self;

                    getFnVars(getAttribute(self.model, m, false)).forEach(function(k){
                        var key = k.split('.');
                        
                        if( key.length>1 ){
                            //单数处理数组的相关方法 如list.push
                            var _key = key.slice(0, key.length-1).join('.');
                            if( $.type(getAttribute(self.model, _key, false)) == 'array' && Array.prototype[key.slice(-1)[0]] ){
                                key = _key;
                            }else{
                                key = key.join('.')
                            }
                        }else{
                            key = k;
                        }
                        if( keys.indexOf(key)<0 ){
                            watchKey.push({key:key, scope:scope});
                            keys.push(key);
                        }
                    });
                })
                console.log(watchKey,keys)
                
                watchKey.forEach(function(item){
                    item.scope.apply(item.key);
                })
                return false;
                //e.preventDefault()
            };
        })
        this.getSubscriber(el);
        // console.log(this.subscriber)
        for( var i in this.subscriber ){
            this.apply(i);
        }
    }
    Module.prototype = {
        createModel : function(el){
            if( $data(el, '$modelBind') ){
                return;
            }

            var self = this,
            tagName = el.tagName.toLowerCase(),
            isFormElement = /input|select|textarea/.test(tagName),
            key = $(el).attr('nj-item');
            $data(el, '$modelBind', 1);

            
            //this.model[key] = typeof this.model[key]=='undefined' ? '' : this.model[key];
            
            if( !isFormElement ){
                return;
            }    

            //el本身也是订阅者
            this.pushSubscriber(el, key, {
                /*
                 * 全部替换value值 
                 * 如value="name:{{name}}" 会替换整个value值
                 * 因为这里是双向绑定 否则只替换{{name}}
                 */
                writeAll : true
            });
            $data(el, '$scope', this.model);

            var checkbox = el.type=='checkbox',
                selectNode = /^select/.test(el.type),
                eventName = checkbox||selectNode||el.type=='radio' ? 'change' : 'input',
                _key = key,
                $$str;  

            //未定义的key设置空字符串
            if( el.type=='text' && getAttribute(self.model, key)===undefined ){
                new Function('a','b','a.'+key+'=b')(self.model, '');
            }

            if( el.type=='radio' ){//设置选中的radio默认值
                if( el.checked ){                    
                    new Function('a','b','a.'+key+'=b')(self.model, el.value);
                }
            }else if( selectNode && !el.getAttribute('nj-each') ){//select默认值

                //var selectVal = el.value || el.options[0].value;
                //el.value = selectVal;
                //new Function('a','b','a.'+key+'=b')(self.model, selectVal);
            }

            function handle(e){
                e = e || window.event;
                var v = this, code = e.keyCode

                // 有效输入键
                if( code==undefined || code==8 || code==32         // e.keyCode [8 : backspace] [32 : space] 
                    || code==229                // 中文键或全角 部分可输入字符
                    || (code>47 && code<58)     // [48-57 : 0-9]
                    || (code>64 && code<91)     // [65-90 : a-z]
                    || (code>95 && code<112)    // [96-111 : 小键盘]
                    || (code>185 && code<193)   // [186-192 : ;=<->/`]
                    || (code>218 && code<223)   // [219-222 : [\]' ]
                ){

                    setTimeout(function(){
                        var val = v[checkbox ? 'checked' : 'value']
                            //$$str = checkbox ? (_key+'='+val) : (_key+'="'+val.replace(/\\/g,'\\\\')+'"');

                        //val = checkbox ? val : val.replace(/\\/g,'\\\\');

                        //同步关联select selectedOptions对象
                        if( selectNode ){
                            // console.log(v.selectedOptions)
                            // console.log(v.selectedIndex)
                            
                            // ie 不支持 v.selectedOptions
                            var selectedOptions = v.selectedOptions || (function(){
                                var sel = [];
                                nodeToArray(v.options).forEach(function(option){
                                    if( option.selected ){
                                        sel.push(option);
                                    }
                                })
                                return sel
                            })();

                            var selected = slice.call(selectedOptions, 0).map(function(option){
                                return option.$data || option.value;
                            })
                            val = v.multiple ? selected : selected[0];
                            // $$str = _key+'='+JSON.stringify(v.multiple?selected:selected[0]);

                            // var $selectedOptions = slice.call(v.selectedOptions, 0).map(function(option){
                            //     //var index = option.index - v.$startIndex;
                            //     return option.index;
                            // });
                            // with(self.model){
                            //     eval(v.$selectedKey+'=['+$selectedOptions+']');
                            // }
                        }
                        new Function('a','b','a.'+key+'=b;if(a.$data){a.$data.'+key+'=b}')(self.model, val);

                        // with(self.model){
                        //     eval($$str);
                        //     if( self.model.$data ){
                        //         $data[_key] = val;
                        //     }
                        // }
                        //参数2：手动输入时 不用更新当前对象
                        
                        self.apply(key, v);

                        //双向绑定的对象都绑定了相关的事件 如外部需添加额外的监听函数 则使用预定义的事件名称绑定函数即可 避免重复绑定事件
                        //如： <input nj-item="name">  可以这样添加事件 $scope.$name$change = function(e){}
                        var fn = getAttribute(self.model, '$'+key+'$change');
                        fn && fn.call(el, e);
                    }, 0)

                }
            }
            
            if( el.type=='text' && $.browser.msie ){
                if( ie8 ){
                    eventName = 'keydown';
                }
            }
            
            $(el).on(eventName, handle);
            // el.addEventListener(eventName, handle, false); 
        },
        //获取订阅者
        getSubscriber : function(element, model){
            element = element || this.element;
            model = model || this.model;

            var self = this,

            subNodes = getAllChildren(element, {
                filter : function(node){
                    return self.getValidSubscribe(node);
                }
            });
            
            //console.log(element)

            subNodes.forEach(function(node){
                var keys = [], 
                    value = node.value || node.nodeValue;

                //firefox bug
                if( node.type=='textarea' ){
                    value = node.innerHTML;
                }
                //一个节点可能关联多个变量 
                //提取出表达式存放在key中     
                value.replace(validNodes, function(a,b){
                    b && keys.indexOf(b)<0 && keys.push(b);
                });
                self.pushSubscriber(node, keys); 
                $data(node, '$scope', model);
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

            if( $data(node, '$filter') || elementNode && /script|style/.test(node.tagName.toLowerCase()) ){
                return subNodes;
            }

            //console.log(node.nodeType,node)

            //ie bug: 文本节点不支持自定义属性 
            //node.$filter = 1;
            $data(node, '$filter', 1);
            
            if( type==1 ){

                /**
                 * [nj-item="*"]声明一个变量 并实现双向绑定
                 * 一般为表单元素 （用户可输入的）匹配其value/checked值
                 */
                node.getAttribute('nj-item') && self.createModel(node);

                var njEach = elementNode && node.getAttribute('nj-each');

                if( njEach ){
                    var eachData = /^\s*([\$\w\|\s:'"]+)\s*$/.exec(njEach);

                    if( !eachData ){
                        return subNodes;
                    }

                    eachData = eachData[1].split('|');
                    eachData.forEach(function(e,i){
                        eachData[i] = e = $.trim(e);
                        if( !e ){
                            eachData.splice(i,1);
                            return;
                        }
                        // 获取选项中的变量引用 nj-each="list|orderBy:order"
                        // 将each对象添加到order的订阅列表中
                        e = e.split(':');
                        if( e[1] && /^[\w\$]+$/.test(e[1]) && $keywords.indexOf(e[1])<0 ){

                            // 预定义未定义的变量 否则下面options获取出错
                            if( getAttribute(self.model, e[1])===undefined ){
                                new Function('a', 'a.'+e[1]+'=undefined')(self.model, e[1]);
                            }
                            self.pushSubscriber(null, e[i], {
                                action : {
                                    //动作名称 如orderBy
                                    name : e[0],
                                    //each对象所对应的名称
                                    key : eachData[0]
                                }
                            });
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
                                $$options = {};
                            }
                        }

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
                    }else{
                        options = {}
                    }

                    //将其子元素拷贝一份作为each模板
                    var templete = options.repeat ? [node] : nodeToArray(node.childNodes),
                        notes = document.createComment(eachData[0]+' each');    
                    templete.push(notes);

                    //将其内部所有元素标记 $filter                    
                    getAllChildren(node).forEach(function(n){
                        $data(n, '$filter', 1);
                    })

                    // 这里拷贝一份模板的副本 否则ie在node.innerHTML清空后templete子元素会消失
                    templete = templete.map(function(n){
                        var _n = n.cloneNode(true);
                        options.repeat && _n.nodeType==1 && _n.removeAttribute('nj-each');
                        return _n
                    })


                    node.$each = {
                        templete : templete,
                        options : options,
                        parentNode : node.parentNode,
                        nextSibling : node.nextSibling,
                        //保存子模型 new Module()
                        models : [],
                        arrayKey : eachData[0]
                    }
                    self.pushSubscriber(node, eachData[0]);
                    
                    if( options.repeat ){//循环节点本身 本身作为模板
                        node.parentNode.removeChild(node);
                        return subNodes;
                    }else{
                        node.innerHTML = '';
                    }
                }

                //获取属性节点
                //ie bug style属性包含{{}}的 ie会视为无效属性 自动去除 使用nj-style替换
                nodeToArray(node.attributes).forEach(function(n){
                    if( validNode.test(n.value) ){
                        //记录属性节点所在的元素节点
                        $data(n, '$parentElement', node);
                        subNodes.push(n);
                    } 
                })
                
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
        //key: {{key}} string|array
        pushSubscriber : function(node, key, data){
            if( !key ){
                return
            }
            var self = this, 
                value = node && (node.value || node.nodeValue), 
                _key = key, 
                keyType = $.type(key),
                rKey = /^\$(parent|root)\./;

            if( node && node.type=='textarea' ){
                value = node.innerHTML;
            }

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

            vars.forEach(push);

            //需要分析这些方法函数中涉及的相关变量 即依赖属性
            methods.forEach(function(k){
                var fn = getAttribute(self.model, k, false),
                    vars = getFnVars(fn);
                
                vars.forEach(function(v){
                    var val = getAttribute(self.model, v, false);
                    val!==undefined && push(v);
                });
            });


            function push(k){
                if( /^\d+$/.test(k) || $keywords.indexOf(k)>=0 ){
                    return;
                }
                //替换一些特殊的关键字 $data.name 实际上是订阅的name属性
                var _k = k;                

                //该节点访问的是父级 所以将其添加到父对象的订阅列表中
                if( rKey.test(k) ){
                    self.options.$parent.pushSubscriber(node, k.replace(rKey, ''));
                    return;
                }

                var subItems = self.subscriber[k] = self.subscriber[k] || [],
                    nodeList = subItems.map(function(item){
                        return item.node
                    })

                //防止重复节点
                if( nodeList.indexOf(node)>=0 ){
                    return;
                }
                
                data = $.extend({
                    node : node,

                    //保存原文本
                    value : value,

                    //提取的表达式
                    //expressions  : keyType=='array' ? _key : [key],
                    
                    vars : vars || [k]
                },data)
                subItems.push(data);
            }
        },        
        //notApply：需要过滤的元素
        apply : function(key, notApply){
            if( !key || key=='function' || !this.model ){//this.model = new model()执行构造函数时 若函数里存在$set操作 此时this.model还未赋值
                return;
            }
            var self = this,
                subscriber = this.subscriber[key] || [],
                value = getAttribute(this.model, key),
            
                //数组或关联数组监控对象
                isArray = /array|object/.test($.type(value));

            // console.log(222,subscriber,key)

            //a.b为a.b.c的上级 上级更新 其所有下级也要同时更新
            for( var i in this.subscriber ){
                if( i.indexOf(key+'.')==0 ){
                    this.apply(i, notApply);
                }
            }
            //console.log(key, subscriber)
            if( !subscriber.length ){
                return;
            }

            //console.log(this.model.order)
            //数组子项发生变化时 需更新数组本身 一般为用户表单输入数据
            if( this.model.$key!==undefined && this.model.$parentScope!==this && key.indexOf('$')<0 && notApply ){
                // console.log(isArray,key, this.model.$parent.list[0], notApply)
                this.model.$parentScope.apply(this.options.$arrayName, notApply);
            }

            //监控数组发生变化时
            // if( key=='$array' && isArray && !subscriber.length ){
            //     //console.log(this.model.$parentScope.subscriber[this.options.$arrayName])
            //     this.model.$parentScope.apply(this.options.$arrayName)
            //     return;
            // }

            //遍历所有订阅该属性的节点
            subscriber.forEach(function(item){

                if( item.action && item.action.name=='orderBy' ){//数组排序
                    self.arrayOrder(value, item.action);
                    return;
                }
                var node = item.node;
                if( node===notApply || node.type=='radio' ){
                    return;
                }
                
                self.updateNode(item, key, value, isArray);          
            })            
        },
        updateNode : function(item, key, value, isArray){
            var self = this, node = item.node, value, valueType;
            
            value = value || getAttribute(this.model, key);

            valueType = $.type(value);
            isArray = isArray || /array|object/.test(valueType);

            if( this.cache[key]===undefined ){

                // 缓存数据 避免连续多次更新相同key-value
                this.cache[key] = {
                    key : key,
                    value : isArray ? $.extend(true,valueType=='array'?[]:{},value) : value
                };

                setTimeout(function(){
                    delete self.cache[key];
                }, 1)
            }else{
                // 比较数据是否发生变化
                var diff = getDifferents(value, this.cache[key].value, valueType);
                
                if( diff.state && $data(node,'$nj_init') ){//无变化且已初始化的节点
                    return;
                }
            }
            

            if( isArray && node.$each && node.$each.arrayKey==key ){
                self.applyArray(node, key);//更新each数组
                return;
            }
            if( /^select/.test(node.type) ){
                //设置select默认选中项
                self.defaultSelected(node); 
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
                $data(node,'$nj_init', 1);//标识节点已更新至少一次

                var $val, scope = $data(node, '$scope') || self.model;

                //该节点可能订阅多个相同或不同的属性 所以分批替换
                text.replace(validNodes, function(a,b){
                    
                    reg = eval('/{{\\s*'+b.replace(/([\$\.\/\+\-\*\/\%\?:\(\),\[\]])/g, '\\$1')+'\\s*}}/g');
                    // console.log(b,reg)
                    //$val = new Function('a', 'return a.'+b)(scope);
                    with(scope){
                        $val = eval('('+b+')');
                    }
                    
                    text = text.replace(reg, $val===undefined?'':$val);

                })

                //属性节点中特殊节点单独处理 for ie
                var attrName = node.name;
                if( type==2 && /^nj-/.test(attrName) ){

                    attrName = node.name.replace(/^nj-/, ''); 
                    var parentNode = $data(node, '$parentElement') || node.ownerElement;

                    if( attrName=='style' ){//ie67 bug 直接设置style属性无效
                        var css = text.split(';');
                        css.forEach(function(s){
                            s = $.trim(s).split(':');
                            var attr = s[0], val = s[1];
                            if( !attr ){
                                return;
                            }
                            parentNode.style[attr] = val;
                        })

                    }else{
                        parentNode[attrName] = $val ? true : false;
                        return;
                    }
                }
                
                if( node.type=='textarea' ){
                    node.innerHTML = text;
                }else{
                    
                }
                node[type==1||type==2?'value':'nodeValue'] = text;

                //将该节点上想关联的key-value保存 避免重复更新同一节点(同一节点可能关联多个key)
                //比如 {{a+b}} {{b+a}} 类似的文本节点 apply(a)后就没必要apply(b)
                item.vars.forEach(function(k){
                    if( k == key ){
                        return;
                    }
                    var val = getAttribute(self.model, k);
                    valueType = $.type(val);
                    isArray = /array|object/.test(valueType);

                    self.cache[k] = {
                        key : k,
                        value : isArray ? $.extend(true,valueType=='array'?[]:{},val) : val
                    };
                })
                
            } 
        },
        applyArray : function(node, key, options){
            if( !node.$each ){
                return;
            }
            options = options || {};

            var self = this,
                eachData = node.$each,

                //主要为了区分options.repeat 循环节点本身需要使用其父节点进行相关节点操作
                nodeSelf = node,
                selectNode,

                array = self.model[key],
                dataType = $.type(array),
                templete = eachData.templete,
                modelsLen = eachData.models.length,
                action = options.action,
                arrayModel;

            if( eachData.options.repeat ){
                nodeSelf = eachData.parentNode;
            }
            if( /^select|optgroup|option/.test(node.tagName.toLowerCase()) && nodeSelf.type ){
                selectNode = nodeSelf;
            }
            
            if( modelsLen ){

                if( action=='order'){
                    // 获取最后一个子元素 
                    var lastNode = nodeSelf.childNodes;
                    lastNode = lastNode[lastNode.length-1];

                    // 循环体最有一个元素
                    var views = eachData.models[modelsLen-1].element;
                    views = views[views.length-1];

                    // 两者相等 表示循环体之外没有其他元素 主要针对repeat=true
                    var moveAction = lastNode===views ? 'appendChild' : 'insertBefore';

                }
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

                    modelsLen = eachData.models.length;

                    for( var i in array ){

                        if( hasKeys.indexOf(i)<0 ){//新增
                            var frag = document.createDocumentFragment();
                            addArray(array[i], i, frag);

                            
                            var last = node.childNodes[templete.length*modelsLen-1];
                            nodeSelf[last.nextSibling?'insertBefore':'appendChild'](frag, last.nextSibling);
                        }                
                        
                    }
                    if( action=='order'){//排序
                        for( var i=0; i<modelsLen; i++ ){
                            arrayModel = eachData.models[i];
                            if( arrayModel.model.$data === options._array[i].value ){
                                continue;
                            }

                            //更新model
                            eachData.models.splice(i, 1);
                            eachData.models.push(arrayModel);

                            //更新views
                            var doms = arrayModel.element;
                            doms.forEach(function(d){
                                nodeSelf[moveAction](d, lastNode);
                            })
                            i--;
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

                        }else if( action=='order'){//排序
                            //更新model
                            eachData.models.splice(i, 1);
                            eachData.models.push(arrayModel);

                            //更新views
                            var doms = arrayModel.element;
                            doms.forEach(function(d){
                                nodeSelf[moveAction](d, lastNode);
                            })
                            i--;

                        }else{
                            eachData.models.splice(i, 1);
                            var el = arrayModel.element;
                            el.forEach(function(n){
                                nodeSelf.removeChild(n);
                            })
                            i--;
                            len--;
                        }
                        
                    }else{
                        var diff = getDifferents(array[i], arrayModel.model);
                        
                        if( diff.state ){
                            // console.log(12,i,diff)
                            continue;
                        }

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

            }else if( action=='order' ){//排序时 dom还未应用
                //console.log(action)
                return;
            }

            var frag = document.createDocumentFragment();
            
            //遍历数组
            //这里如果数组扩展了其他方法 需要过滤掉
            for( var i in array ){
                if( dataType=='array' && Array.prototype[i] ){
                    continue;
                }
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
        //对数组进行排序
        //sort函数返回1：在当前基础上反序 -1 
        arrayOrder : function(orderBy, options){
            //multiple select 传入的orderBy为一个数组
            
            if( $.type(orderBy)=='array' ){
                orderBy = orderBy[0];
                //return;
            }
            
            //获取数组对象
            var self = this, 
                key = options.key,
                array = new Function('a', 'return a.'+key)(this.model),
                dataType = $.type(array),
                orderKey = [],
                _array = [];

            
            //将用于排序的子属性单独提取为一个数组
            for( var i in array ){
                if( dataType=='array' && Array.prototype[i] ){
                    continue;
                }
                orderBy && orderKey.push(new Function('a', 'return a.'+orderBy)(array[i]))
            }
            // console.log(orderBy)
            //只有一项 不用排序
            if( orderKey.length<=1 ){
                return;
            }
            orderKey.sort();
            
            var i, n = orderKey.length, a;
            if( dataType=='array' ){
                for( i=0; i<n; i++ ){
                    a = array[i];
                    if( new Function('a', 'return a.'+orderBy)(a) !== orderKey[i] ){
                        array.splice(i, 1);
                        array.push(a);
                        i--;
                    }
                }
            }else{
                //将原对象拷贝到新的数组中 并删除原对象所有key 变为一个空对象
                for( i in array ){
                    _array.push({
                        key : i,
                        value : array[i]
                    })
                    delete array[i];
                }
                for( i=0; i<n; i++ ){
                    a = _array[i];
                    if( new Function('a', 'return a.'+orderBy)(a.value) !== orderKey[i] ){
                        _array.splice(i, 1);
                        _array.push(a);
                        i--;
                    }else{
                        array[a.key] = a.value;
                    }
                }
            }
            
            //应用到视图中
            var subscriber = this.subscriber[key] || [];
            subscriber.forEach(function(item){
                var node = item.node;
                node.$each ? self.applyArray(node, key, {action:'order', _array:_array}) : self.updateNode(item, key);
            })
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

            nodeToArray(node.options).forEach(function(option){
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

/**
 * 【参考资料】
 * Object.observe 监控对象 : http://www.web-tinker.com/article/20661.html
 * 
 */