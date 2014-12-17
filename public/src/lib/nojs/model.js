/**
 * nojs mvc
 * 2014-11-28
 */
define(function(require){
    
    var $ = require('$'),
        slice = Array.prototype.slice,
        validNode  = /{{\s*([\$\w\.\+\-\*\/\%\!:\?\d''""]+)\s*}}/,
        validNodes = /{{\s*([\$\w\.\+\-\*\/\%\!:\?\d''""]+)\s*}}/g;
    
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
        str.replace(/([\$\w\.\+\-\*\/\%\!:\?]+)\s*\(/g, function(a,b){

            methods.indexOf(b)<0 && methods.push(b);  
        })

        //提取 参数中的变量列表 并替换 所有()内容
        str = str.replace(/\(([\s\w\$\(\),\.\+\-\*\/\%\!:\?]*)\)/g, function(a,b){
            //b(1,c,d(d1,d2))
            b = b.split(/[,\+\-\*\/\%\!:\?]/);
            b.forEach(function(arg){
                arg = arg.replace(/^\(|\)$/, '');//替换掉收尾括号
                if( arg.indexOf('(')>0 ){//参数内容带有函数执行
                    arg = arg.split('(');
                    methods.indexOf(arg[0])<0 && methods.push(arg[0]);    
                    arg = arg[1];
                }
                checkArgument(arg) && vars.indexOf(arg)<0 && vars.push($.trim(arg)) //&& console.log(arg);
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
        

        //分割并过滤语句 提取相关变量名
        str = str.split(';');

        var regCompute = /[\+\-\*\/%\!=\?:]/,       //包含运算符的
            validStr = /[\$\w\.\+\-\*\/%\!=\?:]+/,    //不一定包含运算符的
            keyword = /^(\$(?:parent|root)\.)/
        
        str.forEach(function(s, i){

            str[i] = s = $.trim(s);

            if( keyword.test(s) ){//替换关键字
                str[i] = s.replace(keyword, '$1model.');
            }
            
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
                checkArgument(m) && vars.indexOf(m)<0 && vars.push(m);
            })
            
        })
        //console.log(methods,vars)

        //初始化语句中未定义的变量及方法
        function initMethod(method, isFunction){
            var parent = model, 
                arr = method.split('.'), 
                key = arr[0], 
                last = $.trim(arr.slice(-1)[0]);

            //console.log(arr,watchKey,isFunction)
            //函数每次执行的时候需要监控的变量
            (!isFunction) && key && !/^(\$(?:key|data)\.)/.test(key+'.') && watchKey.indexOf(key)<0 && watchKey.push(key);
            
            if( isFunction ){
                //全局对象下存在的函数
                if( typeof window[key]!='undefined' || key=='$parent' || key=='$root' ){
                    return;
                }

                // if( key=='$array' ){
                //     console.log(key)
                //     return
                // }
               
            }
            arr.forEach(function(m, i){
                m = $.trim(m);
                if( !m || /^true|false&/.test(m) ){//空字符串 或 关键字
                    return;
                }
                parent[m] = parent[m]===undefined ? ((m==last&&!isFunction)?undefined:noopMethod()) : parent[m];
                parent = parent[m];
            });
        }
        //console.log(methods,vars)
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
                node.nodeType==1 && each(node.childNodes);
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
        //console.log(model,modelType)
        if( typeof model != 'function' ){

            model = function(){
                this.$data = _model;
                this.$key = options.$key;
                this.$array = options.$array;

                if( modelType == 'object' ){
                    for( var i in _model ){
                        this[i] = _model[i];
                    }
                }
            }
        }
        //model.prototype.$parent = this.options.$parent || this;
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
        this.model.$parent = this.options.$parent || this;


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
                var data = syntaxInitialize(this, str, self.model),
                    watchKey = data.watchKey;
                //console.log(self.model.$parent)
                with(self.model){
                    try{
                        eval(this.$syntax.str);
                    }catch(e){
                        console.error(e)
                    }
                };
                console.log(watchKey)
                watchKey.forEach(function(key){
                    self.apply(key);
                })
                e.preventDefault()
            };
        })
        this.getSubscriber(el);
        console.log(this.subscriber)
        for( var i in this.subscriber ){
            this.apply(i);
        }
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
            
            this.model[key] = typeof this.model[key]=='undefined' ? '' : this.model[key];
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
                
                $(el).on('change keydown', function(){
                    var v = this;
                    setTimeout(function(){
                        var val = v[v.type=='checkbox' ? 'checked' : 'value'];
                        self.model[key] = val;
                        //参数2：手动输入时 不用更新当前对象
                        self.apply(key, v);
                        // if( self.model.$data ){
                        //     self.model.$data[key] = val;
                        //     self.apply('$data.'+key, v);
                        // }
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
                self.pushSubscriber(node, keys, null); 

                node.$scope = model;
            })
            
        },
        getValidSubscribe : function(node){
            var self = this,
                subNodes = [], 
                type = node.nodeType,
                elementNode = type==1;//元素节点

            if( node.$filter || elementNode && /script|style/.test(node.tagName.toLowerCase()) ){
                return subNodes;
            }
            node.$filter = 1;

            //获取属性节点
            if( type==1 ){

                var attrs = slice.call(node.attributes, 0);
                attrs.forEach(function(n){
                    if( validNode.test(n.value) ){
                        n.$parentElement = node;//记录属性节点所在的元素节点
                        subNodes.push(n);
                    } 
                })

                var njEach = elementNode && node.getAttribute('nj-each');

                if( njEach ){
                    var eachData = /^\s*([\w]+)\s*$/.exec(njEach);
                    if( !eachData ){
                        return subNodes;
                    }
                    //to array
                    childNodes = slice.call(node.childNodes, 0);

                    //将其子元素拷贝一份作为each模板
                    var eachNodesClone = childNodes;                    

                    //将其内部所有元素标记 $filter                    
                    getAllChildren(node).forEach(function(n){
                        n.$filter = 1;
                    })
                    node.innerHTML = '';
                    node.$each = {
                        //index : eachData[1],
                        templete : eachNodesClone,
                        //保存子模型 new Module()
                        models : []
                    }
                    self.pushSubscriber(node, eachData[1]);
                    return subNodes;
                }

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
        },
        //保存获取到的订阅者
        //key: {{key}} 多个key为数组
        //@subScope : 数组单独保存一个对象this.subscriberArray 默认this.subscriber
        pushSubscriber : function(node, key, data, subScope){
            var self = this, 
                value = node.value || node.nodeValue, 
                _key = key, 
                keyType = $.type(key),
                rKey = /^\$(data|parent|root)\./;

            subScope = subScope || this.subscriber;

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
                //console.log(k,vars || [_key],self.options)
                //替换一些特殊的关键字 $data.name 实际上是订阅的name属性
                var _k = k;
                k = k.replace(rKey, function(a,b){
                    if( b=='parent' ){
                        console.log(b,_k,keyType)
                        //该节点访问的是父级 所以将其添加到父对象的订阅列表中
                        self.options.$parent.pushSubscriber(node, k.replace(rKey, ''));
                    }
                    return '';
                });
                if( _k.indexOf('$parent.')==0 ){
                    console.log(k)
                    //return;
                }


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
            if( !key || key=='$key' ){
                return;
            }
            var self = this,
                subscriber = this.subscriber[key] || [],
                value = this.model[key],
                valueType = $.type(value),

                //数组或关联数组监控对象
                observableArray = /array|object/.test(valueType),
                _key = key.split('.');

            //监控数组发生变化时
            if( key=='$array' && observableArray && !subscriber.length ){
                console.log(this.model.$parent.subscriber[this.options.$arrayName])
                this.model.$parent.apply(this.options.$arrayName)
                return;
            }


            //console.log(observableArray,subscriber)

            if( key.indexOf('.')<0 && value===undefined ){
                //return;
            }

            //a.b为a.b.c的上级 上级更新 其所有下级也要同时更新
            
            //遍历所有订阅该属性的节点
            subscriber.forEach(function(item){
                var node = item.node;
                if( node===notApply ){
                    return;
                }

                if( observableArray ){
                    self.applyArray(node, key);
                    //console.log(item.node.$each, self.model[key])
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
                    //属性节点中checked disabled readonly单独处理
                    if( type==2 ){
                        var attrName = node.name, parentNode;
                        if( /checked|disabled|readonly|multiple|selected/.test(attrName) ){
                            parentNode = node.$parentElement;
                            parentNode[value?'setAttribute':'removeAttribute'](attrName, attrName);
                            return;
                        }
                    }

                    //该节点可能订阅多个相同或不同的属性 所以分批替换
                    text.replace(validNodes, function(a,b){
                        var $val, 
                        scope = node.$scope || self.model;
                        
                        //部分关键字可改变作用域 $data $parent $root
                        b = b.replace('$parent.', '$parent.model.');
                        text = text.replace('$parent.', '$parent.model.');
                        //console.log(node,b,scope,key)

                        reg = eval('/{{\\s*'+b.replace(/([\$\.\/\+\-\*\/\%\?:])/g, '\\$1')+'\\s*}}/g');
                        with(scope){
                            $val = eval(b);
                            try{
                                
                            }catch(e){

                            }
                        }
                        //console.log('value:'+$val,reg, text)
                        if( $val!==undefined ){
                            text = text.replace(reg, $val);
                        }
                    })

                    node[type==1||type==2?'value':'nodeValue'] = text;
                }               
            })
        },
        applyArray : function(node, key){
            
            var self = this,
                eachData = node.$each,
                array = self.model[key],
                dataType = $.type(array),
                templete = eachData.templete,
                modelsLen = eachData.models.length;

            if( modelsLen ){
                //console.log(eachData.models[1].model.$data,array[0])
                var isAdd = array.length > modelsLen,//数组是增加还是减少
                    arrayModel;

                for( var i=0; i<modelsLen; i++ ){
                    arrayModel = eachData.models[i];
                    arrayModel.model.$key = i;//更新$key
                    if( arrayModel.model.$data !== array[i] ){
                        if( isAdd ){

                        }else{
                            eachData.models.splice(i, 1);
                            var el = arrayModel.element;
                            el.forEach(function(n){
                                node.removeChild(n);
                            })
                            i--;
                            modelsLen--;
                            //arrayModel = null;
                        }
                        
                    }
                }
                return;
            }
            //console.log(array)

            var frag = document.createDocumentFragment(),
                groupNodes;
            
            //遍历数组
            for( var i in array ){

                //获取该组所有节点及子节点
                groupNodes = [];

                templete.forEach(function(n){
                    //从模板节点中拷贝 一份
                    var node = n.cloneNode(true);
                    frag.appendChild(node);
                    groupNodes.push(node);
                })
                //console.log(i,array[i])
                eachData.models.push(new Module(groupNodes, array[i] , {
                    $key : dataType=='array' ? parseInt(i) : i,
                    //关联父对象
                    $parent : self,
                    $array : array,
                    $arrayName : key
                }))
                //console.log(array[i], i, self.model[key])
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
            var el = $(document.body).find('[nj-module="'+name+'"]')[0];
            return new Module(el, model).model;
        }
    }
})