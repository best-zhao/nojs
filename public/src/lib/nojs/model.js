/**
 * nojs.model
 * 2014-11-28
 */
define(function(require){
    
    var $ = require('$'),
        slice = Array.prototype.slice,
        validNode = /{{([\w\.\+\-\*\/\%\!:\?\d]+)}}/,
        validNodes = /{{([\w\.\+\-\*\/\%\!:\?\d]+)}}/g;
    
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
            attrName = {method:[], arg:[]},
            watchKey = [],
            data = {
                //replaceStr : reStr,
                watchKey : watchKey
            };


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
            attrName.method.indexOf(b)<0 && attrName.method.push(b);  
        })

        //提取 参数中的变量列表 并替换 所有()内容
        str = str.replace(/\(([\s\w\(\),\.\+\-\*\/\%\!:\?]*)\)/g, function(a,b){
            //b(1,c,d(d1,d2))
            b = b.split(/[,\+\-\*\/\%\!:\?]/);
            b.forEach(function(arg){
                arg = arg.replace(/^\(|\)$/, '');//替换掉收尾括号
                if( arg.indexOf('(')>0 ){//参数内容带有函数执行
                    arg = arg.split('(');
                    attrName.method.indexOf(arg[0])<0 && attrName.method.push(arg[0]);    
                    arg = arg[1];
                }
                checkArgument(arg) && attrName.arg.indexOf(arg)<0 && attrName.arg.push(arg) //&& console.log(arg);
            })

            var key = ';'+akey+(++n)+';';
            reStr[key] = a;
            return key;
        })
        
        

        //是否为有效的变量
        function checkArgument(arg){
            arg = $.trim(arg);
            if( !arg || reStr[arg] || /^(\d+|true|false|var)$/.test(arg) ){
                return false;
            }else{
                return true;
            }
        }

        //分割并过滤语句
        str = str.split(';');

        var regCompute = /[\+\-\*\/%\!=\?:]/;

        str.forEach(function(s, i){

            str[i] = s = $.trim(s);

            //运算符语句匹配 a=b; a=a==1?2:1;
            
            if( !s || !regCompute.test(s) ){
                return;
            }

            var computeVars = s.split(regCompute);
            computeVars.forEach(function(m){
                checkArgument(m) && attrName.arg.indexOf(m)<0 && attrName.arg.push(m);
            })
        })

        function initMethod(method, isFunction){
            var parent = model, 
                arr = method.split('.'), 
                key = arr[0], 
                last = $.trim(arr.slice(-1)[0]);

            //函数每次执行的时候需要监控的变量
            !isFunction && key && watchKey.indexOf(key)<0 &&  watchKey.push(key);

            arr.forEach(function(m){
                m = $.trim(m);
                if( !m || /^true|false&/.test(m) ){//空字符串 或 关键字
                    return;
                }
                parent[m] = parent[m] || ((m==last&&!isFunction)?undefined:noopMethod());
                parent = parent[m];
            });
        }

        attrName.method.forEach(function(name){
            initMethod(name, true);
        })

        for( var i=0,n=attrName.arg.length,name; i<n; i++ ){
            name = attrName.arg[i];
            if( !checkArgument(name) ){//过滤无效参数 
                attrName.arg.splice(i, 1);
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

        console.log(str,'\n',attrName.method,attrName.arg);

        return data;
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
        this.subIds = [];
        
        var self = this;
        
        if( typeof model == 'function' ){
            model.prototype.$set = function(key, value) {
                this[key] = value;
                self.apply(key);
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
        console.log(syntaxParse("a.b(1+1,c,d(d1,d2))?'show':'hide'", this.model))

        /**
         * [nj-click="*"]绑定click事件
         * 
         */
        var clicks = this.element.find('[nj-click]');
        
        clicks.each(function(){
            var str = $(this).attr('nj-click'),
                fnKey = 'nj-click-fn-'+(+new Date),
                watchKey;

            this.onclick = function(){
                if( !this[fnKey] ){                
                    var data = syntaxParse(str, self.model);
                    //console.log(data)
                    watchKey = data.watchKey;
                    this[fnKey] = data.str;
                }
                with(self.model){
                    eval(this[fnKey]);
                    try{
                        
                    }catch(e){
                        //console.error(e)
                    }
                };
                console.log(watchKey)
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
                this.subscriber[key] = this.subscriber[key] || [];
                this.subscriber[key].push({
                    node : el,
                    /*
                     * 全部替换value值 
                     * 如value="name:{{name}}" 会替换整个value值
                     * 因为这里是双向绑定 否则只替换{{name}}
                     */
                    writeAll : true
                })
                //el.$id = id;
                //this.subIds.push(id);
                
                $(el).on('change keydown', function(){
                    var v = this;
                    setTimeout(function(){
                        self.model[key] = v[v.type=='checkbox' ? 'checked' : 'value'];
                        self.apply(key);
                    },0)
                })
            }
            return model;
        },
        //获取订阅者
        getSubscriber : function(){
            var self = this,
                subs = this.element[0].childNodes,
                $subNodes = this.element.find('*').add(subs),
                subNodes = [];
            
            $subNodes.each(function(i){
                var node = this,
                    html = $.trim(node.outerHTML || node.nodeValue),
                    children, $children,
                    i, n, _node, text, attrs;
                
                if( !validNode.test(html) ){
                    return;
                }
                //获取属性节点
                attrs = slice.call(node.attributes, 0);
                attrs.forEach(function(n){
                    if( validNode.test(n.value) ){
                        n.$parentElement = node;
                        subNodes.push(n);
                    } 
                })
                
                //textarea手动修改内容后 子节点会被替换 所以其包含的文本节点不用添加
                if( node.type=='textarea' ){
                    subNodes.push(node);
                    return;
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
            })
            
            subNodes.forEach(function(node){
                //node.$id = (+new Date);
                
                var key = [], 
                    value = node.value || node.nodeValue;
                    
                value.replace(validNodes, function(a,b){
                    b && key.indexOf(b)<0 && key.push(b);
                });
                //console.log(key)
                key.forEach(function(k){
                    self.subscriber[k] = self.subscriber[k] || [];
                    self.subscriber[k].push({
                        node : node,
                        value : value
                    });
                })
            })
            //console.log(this.subscriber)
            for( var i in this.subscriber ){
                //console.log(i)
                this.apply(i);
            }
        },
        apply : function(key){
            var self = this,
                subscriber = this.subscriber[key] || [],
                value = this.model[key];
            
            if( key.indexOf('.')<0 && value===undefined ){
                return;
            }
            //遍历所以订阅该属性的节点
            subscriber.forEach(function(item){
                var type = item.node.nodeType;
                
                if( item.writeAll ){
                    item.node.value = value;
                    
                }else if( type==1 ||type==2 || type==3 ){//元素、属性、文本节点

                    var text = item.value || item.node.value, 
                        reg;
                    
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
                        console.log(text,b)
                        reg = eval('/{{'+b+'}}/g');
                        with(self.model){
                            try{
                                $val = eval(b);
                            }catch(e){

                            }
                        }
                        //console.log('value:'+$val,reg,self.model.$val)
                        if( $val!==undefined ){
                            text = text.replace(reg, $val);
                        }
                    })
                    item.node[type==1||type==2?'value':'nodeValue'] = text;
                }               
            })
        }
    }
    
    
    $(function(){
        var modules = $(document.body).find('[nj-module]');
        modules.each(function(){
            //new Module(this);
        })
    })
    
    return {
        module : function(name, model){
            var el = $(document.body).find('[nj-module="'+name+'"]');
            return new Module(el, model).model;
        }
    }
})