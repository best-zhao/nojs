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
            console.log(str)
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
                reStr = {};

            str = str.replace(/\)\s*{[\w\W]*}/g, ')');
            str = str.replace(/"(?:\\"|[^"])*"|'(?:\\'|[^'])*'/g, function(a,b,c){
                if( a ){
                    var key = 'nj-str-'+(+new Date);
                    reStr[key] = a;
                    return key;
                }                
            })
            str = str.split(';');
            str.forEach(function(s, i){
                if( /[{}]+/g.test(s) ){
                    str[i] = '';
                }
            })
            console.log(str)


            this.onclick = function(){
                
                if( !this[isok] ){
                
                    var notDefinedVars = [];
                    
                    function _try(){
                        var scope = function(){};
                        for( var i in self.model ){
                            scope[i] = self.model[i];
                        }
                        with(scope){
                            try{
                                eval(str);
                            }catch(e){
                                var msg = e.message.split(' '), info = msg.slice(-1);
                                if( info=='defined' ){
                                    //定义未定义的变量
                                    self.model[msg[0]] = undefined;
                                    notDefinedVars.push(msg[0]);
                                    _try();
                                }
                            }
                        }
                    }
                    //_try();
                    
                    //console.log(notDefinedVars);
                }
                this[isok] = 1;
                console.log(str.split(';'))

                with(self.model){
                    try{
                        eval(str);
                    }catch(e){
                        console.error(e)
                    }
                };
                //self.apply('isopen');
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
                    }else{

                        //该节点可能订阅多个相同或不同的属性 所以分批替换
                        text.replace(validNodes, function(a,b){
                            value = self.model[b];
                            if( value!==undefined ){
                                reg = eval('/{{'+b+'}}/g');
                                text = text.replace(reg, value)
                            }
                        })
                    }
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