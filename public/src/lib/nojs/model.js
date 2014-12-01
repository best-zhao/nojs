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
        
        var clicks = this.element.find('[nj-click]');
        
        clicks.each(function(){
            var str = $(this).attr('nj-click'),
            fn = new Function(str);
            this.onclick = function(){
                /**
                 * ****解决未定义变量问题****
                 * 
                 * 拷贝self.model所有变量及方法到一个新的变量scope中
                 * 函数试着在scope中不断try/catch获取到所有未定义的变量 知道函数执行完毕
                 * 然后with原作用域下 依次定义这些变量后再执行函数
                 *
                 * case1: 抛出的错误中不光只有not defined 中途可能有其他错误 这时终止即可
                 *        此外还需检测函数何时执行完毕 否则会出现死循环（添加一个额外变量，在函数末尾执行某一操作即可）
                 *     
                 */
                var scope = function(){}, notDefinedVars = [];
                for( var i in self.model ){
                    scope[i] = self.model[i];
                }
                with(scope){
                    function _try(){
                        try{
                            eval(str);
                        }catch(e){
                            var msg = e.message.split(' '), info = msg.slice(-1);
                            if( info=='defined' ){
                                eval('('+msg[0]+'=undefined)');
                                notDefinedVars.push(msg[0]);
                                _try();
                            }
                        }
                    }
                    _try();
                }
                console.log(notDefinedVars);

                var error;
                with(self.model){
                    try{
                        eval(str);
                    }catch(e){
                        //处理未定义的变量及属性
                        error = true;
                        var msg = e.message.split(' '), info = msg.slice(-1);
                        if( info=='defined' ){
                            eval('('+msg[0]+'=undefined)');
                        }
                    }finally{
                        error && eval(str);
                    }
                };
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
                
                $(el).on('keydown', function(){
                    var v = this;
                    setTimeout(function(){
                        self.model[key] = v.value;
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
                attrs.forEach(function(node){
                    validNode.test(node.value) && subNodes.push(node);
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
                
                if( item.writeAll || type==2 ){
                    item.node.value = value;
                    
                }else if( type==1 || type==3 ){//元素、文本节点
                    var text = item.value || item.node.value, 
                        reg;
                    
                    //该节点可能订阅多个相同或不同的属性 所以分批替换
                    text.replace(validNodes, function(a,b){
                        value = self.model[b];
                        if( value!==undefined ){
                            reg = eval('/{{'+b+'}}/g');
                            text = text.replace(reg, value)
                        }
                    })
                    item.node[type==1?'value':'nodeValue'] = text;
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