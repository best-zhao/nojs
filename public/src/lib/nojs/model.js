/**
 * nojs.model
 * 2014-11-28
 */
define(function(require){
    
    var $ = require('$'),
        slice = Array.prototype.slice,
        validNode = /{{(\w+)}}/,
        validNodes = /{{(\w+)}}/g;
    
    /**
     * 以model为单位 一个页面可存在多个 也可互相嵌套
     * 在页面中通过在tag中添加'nj-module="myModule"'来启动
     * 
     */
    
    
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
         * [nj-click="*"]绑定click事件
         * 
         */
        var clicks = this.element.find('[nj-click]');
        
        clicks.each(function(){
            var str = $(this).attr('nj-click');
            //var fn = new Function(str);
            
            /**
             * 解析语句
             * 支持语法：1.赋值 2.执行函数 其余语句过滤掉
             * 
             * 1. 替换{语句块}的内容及''的内容
             * 2. 以';'分割语句
             * 3. 
             *     
             */
            var fnKey = 'nj-click-fn-'+(+new Date),
                reStr = {},
                attrName = {method:[], arg:[], vars:[]},
                watchKey = [];

            str = str.replace(/\)\s*{[\w\W]*}/g, ')');

            //替换字符串内容
            var skey = 'nj_str_', n = 0;
            str = str.replace(/"(?:\\"|[^"])*"|'(?:\\'|[^'])*'/g, function(a,b,c){
                if( a ){
                    var key = skey+(++n);
                    reStr[key] = a;
                    return key;
                }
            })
            //console.log(str)

            //分割并过滤语句
            str = str.split(';');
            str.forEach(function(s, i){

                str[i] = s = $.trim(s);

                /**
                 * \)[^;$]   函数执行必须为一句单独的语句 避免for(var i a) console.log(a[i]) 
                 * [{}]+     去除含语句块的
                 */
                if( /\)[^;$]|[{}]+/.test(s) ){
                    str[i] = '';
                    return;
                }

                /**
                 * 匹配方法名称及属性名称
                 */
                var methods = /^([\w\.]+)\(/.exec(s),
                    argVars = /\(([\w\s,\.\-+]+)\)$/.exec(s),
                    //运算符 a=b; a=a==1?2:1;
                    computeVars = /(?:^|[\(\s])([\w]+)[\+\-\*\/\!=]{1,2}([\w\?\:\+\-\*\/\!=]*)(?:$|[\s\),])/.exec(s);

                //方法名
                if( methods ){
                    methods.shift();
                    methods.forEach(function(m){
                        attrName.method.push(m);
                    })
                }
                //参数 可能是属性名 也可能是方法名
                if( argVars ){
                    argVars.shift();
                    argVars.forEach(function(m){
                        attrName.arg = attrName.arg.concat(m.split(/[\+\-\*\/=\?\:,]/));
                    })
                }
                //运算的对象
                if( computeVars ){
                    computeVars.shift();
                    computeVars.forEach(function(m){
                        attrName.arg = attrName.arg.concat(m.split(/[\+\-\*\/=\?\:]/));
                    })
                }

                //console.log(i, [].concat(attrName.method), [].concat(attrName.arg))
            })
            //console.log([].concat(attrName.method), [].concat(attrName.arg))

            var noopMethod = function(){
                return function(){};
            };

            //isFunction 当method作为参数或者运算对象时 最末尾的置为undefined 否则置为noop
            function initMethod(method, isFunction){
                var parent = self.model, arr = method.split('.'), last = $.trim(arr.slice(-1)[0]);
                watchKey.push(arr[0]);
                arr.forEach(function(m){
                    //console.log('initMethod',m)
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
            attrName.arg.forEach(function(name){
                //console.log('attrName.arg',name)
                if( reStr[name] || /^\d+$/.test(name) ){//过滤被替换的字符串 
                    return;
                }
                initMethod(name);
            })

            str = str.join(';');
            //还原被替换的字符串
            for( var i in reStr ){
                str = str.replace(eval('/'+i+'/g'), reStr[i]);
            }
            //console.log(str)

            this.onclick = function(){
                
                if( !this[fnKey] ){                
                    
                    //console.log(notDefinedVars);
                }
                this[fnKey] = str;
                

                with(self.model){
                    eval(this[fnKey]);
                    try{

                    }catch(e){
                        console.log(e)
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
                this.apply(i);
            }
        },
        apply : function(key){
            var self = this,
                subscriber = this.subscriber[key] || [],
                value = this.model[key];
                
            if( value===undefined ){
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
                            text = !!parseInt(value, 10);
                            parentNode[text?'setAttribute':'removeAttribute'](attrName, attrName);
                            return;
                        }
                    }
                    //该节点可能订阅多个相同或不同的属性 所以分批替换
                    text.replace(validNodes, function(a,b){
                        value = self.model[b];
                        if( value!==undefined ){
                            reg = eval('/{{'+b+'}}/g');
                            text = text.replace(reg, value)
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