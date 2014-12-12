/**
 * nojs.model
 * 2014-11-28
 */
define(function(require){
    
    var $ = require('$'),
        slice = Array.prototype.slice,
        validNode = /{{([\w\.\+\-\*\/\%\!:\?\d''""]+)}}/,
        validNodes = /{{([\w\.\+\-\*\/\%\!:\?\d''""]+)}}/g;
    
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
    function syntaxParse(str, model){
        var reStr = {},
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
        str.replace(/([\w\.\+\-\*\/\%\!:\?]+)\s*\(/g, function(a,b){
            methods.indexOf(b)<0 && methods.push(b);  
        })

        //提取 参数中的变量列表 并替换 所有()内容
        str = str.replace(/\(([\s\w\(\),\.\+\-\*\/\%\!:\?]*)\)/g, function(a,b){
            //b(1,c,d(d1,d2))
            b = b.split(/[,\+\-\*\/\%\!:\?]/);
            b.forEach(function(arg){
                arg = arg.replace(/^\(|\)$/, '');//替换掉收尾括号
                if( arg.indexOf('(')>0 ){//参数内容带有函数执行
                    arg = arg.split('(');
                    methods.indexOf(arg[0])<0 && methods.push(arg[0]);    
                    arg = arg[1];
                }
                checkArgument(arg) && vars.indexOf(arg)<0 && vars.push(arg) //&& console.log(arg);
            })

            var key = ';'+akey+(++n)+';';
            reStr[key] = a;
            return key;
        })

        //是否为有效的变量
        function checkArgument(arg){
            arg = $.trim(arg);
            if( !arg || reStr[arg] || /^(\d+|true|false|var|for)$/.test(arg) ){
                return false;
            }else{
                return true;
            }
        }

        //分割并过滤语句
        str = str.split(';');

        var regCompute = /[\+\-\*\/%\!=\?:]/,       //包含运算符的
            validStr = /[\w\.\+\-\*\/%\!=\?:]+/;    //不一定包含运算符的

        str.forEach(function(s, i){

            str[i] = s = $.trim(s);

            //运算符语句匹配 a=b; a=a==1?2:1;            
            if( !s || !validStr.test(s) ){
                return;
            }

            var computeVars = s.split(regCompute);
            
            computeVars.forEach(function(m){
                checkArgument(m) && vars.indexOf(m)<0 && vars.push(m);
            })

        })

        //初始化语句中未定义的变量及方法
        function initMethod(method, isFunction){
            var parent = model, 
                arr = method.split('.'), 
                key = arr[0], 
                last = $.trim(arr.slice(-1)[0]);

            //函数每次执行的时候需要监控的变量
            !isFunction && key && watchKey.indexOf(key)<0 && watchKey.push(key);

            arr.forEach(function(m){
                m = $.trim(m);
                if( !m || /^true|false&/.test(m) ){//空字符串 或 关键字
                    return;
                }
                parent[m] = parent[m]===undefined ? ((m==last&&!isFunction)?undefined:noopMethod()) : parent[m];
                parent = parent[m];
            });
        }

        methods.forEach(function(name){
            initMethod(name, true);
        })

        for( var i=0,n=vars.length,name; i<n; i++ ){
            name = vars[i];
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
    function syntaxInitialize(dom, str, model){
        if( !dom || !str){
            return;
        }
        if( dom.$syntax ){
            return dom.$syntax;
        }
        return dom.$syntax = syntaxParse(str, model);
    }

    //将节点本身、其属性节点及其childNodes中的文本节点 筛选出有效的订阅节点
    function getSubscribeNodes(node){
        var html = $.trim(node.outerHTML || node.nodeValue),
            children, $children,
            i, n, _node, text, attrs, subNodes = [];

        if( !validNode.test(html) ){
            return subNodes;
        }

        //获取属性节点
        if( node.nodeType==1 ){
            attrs = slice.call(node.attributes, 0);
            attrs.forEach(function(n){
                if( validNode.test(n.value) ){
                    n.$parentElement = node;
                    subNodes.push(n);
                } 
            })

            //textarea手动修改内容后 子节点会被替换 所以其包含的文本节点不用添加
            //<textarea>{{name}}+abc</textarea>
            if( node.type=='textarea' ){
                subNodes.push(node);
                return subNodes;
            }
        }else if( validNode.test(html) ){//满足条件的文本节点
            subNodes.push(node);
            return subNodes;
        }
        

        //将children中有用的文本节点添加到subNodes数组中
        children = slice.call(node.childNodes, 0);
        $children = $(node).children();
        n = children.length;
            
        for( i=0; i<n; i++ ){
            _node = children[i];
            if( _node.nodeType!=3 ){
                continue;
            }
            text = $.trim(_node.nodeValue);
            if( text && validNode.test(text) ){
                subNodes.push(_node);
            }
        }

        return subNodes;
    }

    //获取全部子节点 包括文本节点
    function getAllChildren(node, options){
        options = options || {};
        
        var children = [];

        options.andSelf && push(node);

        function each(nodes){
            
            if( !nodes || !nodes.length ){
                return;
            }
            var node, i=0, n = nodes.length;
            for( ; i<n; i++ ){
                node = nodes[i];
                push(node);
                node.nodeType==1 && each(node.childNodes);
            }
        }
        each(node.childNodes);

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
    function getValidSubscribe(node){
        return getAllChildren(node, {
            filter : function(node){
                return getValidSubscribe.filter(node);
            }
        })
    }
    getValidSubscribe.filter = function(node){
        var subNodes = [], type = node.nodeType;

        //获取属性节点
        if( type==1 ){
            var attrs = slice.call(node.attributes, 0);
            attrs.forEach(function(n){
                console.log(n)
                if( validNode.test(n.value) ){
                    n.$parentElement = node;//记录属性节点所在的元素节点
                    subNodes.push(n);
                } 
            })

            //textarea手动修改内容后 子节点会被替换 所以其包含的文本节点不用添加
            //<textarea>{{name}}+abc</textarea>
            if( node.type=='textarea' ){
                subNodes.push(node);
            }
        }else if( type==3 ){//满足条件的文本节点
            var html = $.trim(node.nodeValue);
            validNode.test(html) && subNodes.push(node);
        }
        
        return subNodes;
    }

    /**
     * 创建一个module
     * 
     */
    function Module(el, model){
        this.element = $(el);
        this.model = model || {};
        this.models = [];
        
        this.subscriber = {};
        
        var self = this;
        
        if( typeof model == 'function' ){
            model.prototype.$set = function(key, value) {
                
                var parent = this, i=0,  _key = key.split('.'), n=_key.length, name = _key.slice(-1);
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
                    parent[name].apply(null, args);

                }else{
                    //a.b.c = value 赋值
                    parent[name] = value;
                }
                self.apply(key);
                //console.log(this.arr.x)
            }
            this.model = new model();
        }
        
        this.domID = {};
        
        /**
         * [nj-item="*"]声明一个变量 并实现双向绑定
         * 一般为表单元素 （用户可输入的）匹配其value值
         */
        var items = this.element.find('[nj-item]');
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
        var clicks = this.element.find('[nj-click]');
        
        clicks.each(function(){
            var str = $(this).attr('nj-click');
            this.onclick = function(){
                var data = syntaxInitialize(this, str, self.model),
                    watchKey = data.watchKey;
                
                with(self.model){
                    eval(this.$syntax.str);
                    try{
                        
                    }catch(e){
                        //console.error(e)
                    }
                };
                watchKey.forEach(function(key){
                    self.apply(key);
                })
            };
        })
        this.getSubscriber();

    }
    Module.prototype = {
        createModel : function(el){
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
            
            this.model[key] = this.model[key] || '';
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
                
                $(el).on('change keydown', function(){
                    var v = this;
                    setTimeout(function(){
                        self.model[key] = v[v.type=='checkbox' ? 'checked' : 'value'];
                        //参数2：手动输入时 不用更新当前对象
                        self.apply(key, v);
                    },0)
                })
            }
            return model;
        },
        //获取订阅者
        getSubscriber : function(element, model){
            element = element || this.element;
            model = model || this.model;

            var self = this,
                subs = element[0].childNodes,
                $subNodes = slice.call(element.find('*'), 0).concat(slice.call(subs, 0)),
                subNodes = [];

            $subNodes.forEach(function(node){
                
                var elementNode = node.nodeType==1;//元素节点
                if( node.$filter || elementNode && /script|style/.test(node.tagName.toLowerCase()) ){
                    //console.log(node.$filter, node, node.parentNode)
                    return;
                }
                node.$filter = 1;
                
                var njEach = elementNode && node.getAttribute('nj-each'),
                    childNodes = node.childNodes;

                if( njEach ){
                    var eachData = /^\s*([\w]+)\s+in\s+([\w]+)\s*$/.exec(njEach);
                    if( !eachData ){
                        return;
                    }
                    //to array
                    childNodes = slice.call(childNodes, 0);

                    //将其子元素拷贝一份作为each模板
                    var eachNodesClone = childNodes
                    // var eachNodesClone = childNodes.map(function(node){
                    //     return node;
                    // });

                    //将其内部所有元素标记 $filter
                    // slice.call($(node).find('*'), 0).concat(childNodes).forEach(function(n){
                    //     n.$filter = 1;
                    // });
                    getAllChildren(node).forEach(function(n){
                        n.$filter = 1;
                    })
                    node.innerHTML = '';
                    node.$each = {
                        index : eachData[1],
                        templete : eachNodesClone
                    }
                    self.pushSubscriber(node, eachData[2]);
                    return;
                }
                subNodes = subNodes.concat(getSubscribeNodes(node));
            })
            
            subNodes.forEach(function(node){
                var keys = [], 
                    value = node.value || node.nodeValue;

                //一个节点可能关联多个变量 
                //提取出表达式存放在key中     
                value.replace(validNodes, function(a,b){
                    b && keys.indexOf(b)<0 && keys.push(b);
                });
                self.pushSubscriber(node, keys); 
            })
            
            for( var i in this.subscriber ){
                this.apply(i);
            }
        },

        //保存获取到的订阅者
        //key: {{key}} 多个key为数组
        pushSubscriber : function(node, key, data){
            var self = this, value = node.value || node.nodeValue, _key = key, keyType = $.type(key);

            if( keyType=='string' || data && data.writeAll ){
                push(key);
                return;
            }

            //将关联多个变量的引用组合成一条语句进行分析
            if( $.type(key)=='array' ){
                key = key.join(';');
            }
           
            //提取相关变量
            var d = syntaxInitialize(node, key, this.model),
                vars = d.vars;

            vars.forEach(push);

            function push(k){
                self.subscriber[k] = self.subscriber[k] || [];
                
                data = $.extend(data, {
                    node : node,

                    //保存原文本
                    value : value,

                    //提取的表达式
                    expressions  : keyType=='array' ? _key : [key]
                })
                self.subscriber[k].push(data);
            }
        },
        //notApply：需要过滤的元素
        apply : function(key, notApply){
            var self = this,
                subscriber = this.subscriber[key] || [],
                value = this.model[key],
                valueType = $.type(value),

                //数组或关联数组监控对象
                observableArray = /array|object/.test(valueType),
                _key = key.split('.');
            
            
            if( key.indexOf('.')<0 && value===undefined ){
                //return;
            }

            //a.b为a.b.c的上级 上级更新 其所有下级也要同时更新
            
            //遍历所有订阅该属性的节点
            subscriber.forEach(function(item){

                if( item.node===notApply ){
                    return;
                }

                if( observableArray ){
                    self.applyArray(item.node, key);
                    //console.log(item.node.$each, self.model[key])
                    return;
                }

                var type = item.node.nodeType;
                
                if( item.writeAll ){
                    item.node.value = value;
                    
                }else if( type==1 ||type==2 || type==3 ){//元素、属性、文本节点

                    var text = item.value || item.node.value, 
                        reg;

                    if( !text ){
                        return;
                    }
                    //属性节点中checked disabled readonly单独处理
                    if( type==2 ){
                        var attrName = item.node.name, parentNode;
                        if( /checked|disabled|readonly|multiple|selected/.test(attrName) ){
                            parentNode = item.node.$parentElement;
                            //text = !!parseInt(value, 10);
                            parentNode[value?'setAttribute':'removeAttribute'](attrName, attrName);
                            return;
                        }
                    }
                    
                    //该节点可能订阅多个相同或不同的属性 所以分批替换
                    text.replace(validNodes, function(a,b){
                        //value = self.model[b];                        
                        var $val;
                        reg = eval('/{{'+b.replace(/([.\/\+\-\*\/\%\?:])/g, '\\$1')+'}}/g');
                        with(self.model){
                            $val = eval(b);
                            try{
                                
                            }catch(e){

                            }
                        }

                        //console.log('value:'+$val,reg,self.model.$val)
                        if( $val!==undefined ){
                            text = text.replace(reg, $val);
                            
                        }
                        //console.log($val)
                    })
                    //console.log(text)

                    item.node[type==1||type==2?'value':'nodeValue'] = text;
                }               
            })
        },
        applyArray : function(node, key){
            var self = this,
                eachData = node.$each,
                data = self.model[key],
                templete = eachData.templete;

            var frag = document.createDocumentFragment(),
                groupNodes;
            
            //遍历数组
            for( var i in data ){

                //获取该组所有节点及子节点
                groupNodes = [];

                templete.forEach(function(n){
                    //从模板节点中拷贝 一份
                    var node = n.cloneNode(true);
                    frag.appendChild(node);
                    //groupNodes = groupNodes.concat(getChildren(node, true));
                })
                //console.log(groupNodes)
            }
            node.appendChild(frag);
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
            var el = $(document.body).find('[nj-module="'+name+'"]');
            return new Module(el, model).model;
        }
    }
})