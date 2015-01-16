/*
 * 侧栏导航菜单
 */

define(function(require){
    
    var $ = require('$'),
        ui = require('ui'),
        url = require('./url'),
        tree = require('../lib/nojs/mods/tree'),
        side = $('#side_menu'),
        setUrl = url.setUrl,
        first = 0,
        menu = {items:[]},
        G;
    
    url.onHashChange.push(function(e, data){
        var id = data.id, m,
            key = data.key;

        if( id && (key=='id'||key=='url') && menu.items.length ){
            for( var i=0;i<menu.items.length;i++ ){
                m = menu.items[i];
                if( m.data.all[id] ){
                    first = 2;
                    m.select(id);
                    first = 1;
                    break;
                }
            }            
        }       
    })
        
    var treeOptions = {
        //defaultNode : 'nojs_info',
        onSelect : function(data){
            if( !first && setUrl() ){//页面首次加载
                treeSelect.call(this, data);
                first = 1;
                return;
            }
            if( first==2 ){//onhashchange
                treeSelect.call(this, data); 
            }else{
                var _data = {id:data[tree.key.id]};                
                if( first ){//tree click 通过hash变化来触发onSelect事件
                    _data['url'] = null;
                }
                setUrl(_data);
                first = 1;
            }
        }
    }
    /*
     * #url直接加载url指定地址
     * id和url同时出现时 id高亮 url为真实页面 可用于url是id下的子页面
     */
    function treeSelect(data){
        var link = data.link,
            id = data[tree.key.id];

        if(!link){
            return;
        }
        var _url = setUrl('url');
        
        var _id = this.box[0].id,
            name = _id.substring(_id.indexOf('_')+1,_id.length),
            url = _url || link,
            title = document.title,
            _data = {
                title : data.name,
                url : url
            };
        
        title = title.indexOf(' - ')>-1 ? title.split(' - ')[1] : title;  
        
        G.beforeSend && G.beforeSend(_data);
        
        document.title = data.name+' - '+title; 
        this.box.siblings('.nj_tree').find('a.current').removeClass('current');
        
        menu.load(_data, data);
        
        //记录最后访问的节点
        $.localStorage.set('lastNode', id);
    }
    menu.load = function(data, treeData){
        data = data || G.data;
        if( treeData && treeData.content ){
            setTimeout(function(){
                call(treeData.content);
            }, 1)
            return;
        }
        $.ajax({
            url : data.url,
            type : 'get',
            dataType : 'html',
            headers : {noAjax:true},
            success : call
        })
        function call(html){
            G.$content.html(html);
            G.complete && G.complete(data);  
        }
    };
    
    function treeInit(){
        var menu = G.options.menu;
        typeof menu=='string' ? $.getJSON(menu, call) : call(menu);

        function call(json){
            for( var i in json ){            
                createProject( i, json[i] );
            }
        }
    }

    function createProject(name, p){
        var data = p.data, _tree, id;
        
        if( p.disable=='true' || !data ){return;}
        id = 'menu_'+name;
        _tree = $('<div id="'+id+'" class="nj_tree"></div>');
        side.append(_tree); 
        _tree.data('id', name); 
        var t = new tree( id, {
            data : data,
            onSelect : treeOptions.onSelect,
            defaultNode : treeOptions.defaultNode
        });
        menu.items.push(t);
    }
    
    menu.init = function(global){
        G = global;
        treeOptions.defaultNode = setUrl() || G.options.defaultNode;//设置默认节点
        if( G.options.treeKey ){
            tree.key = G.options.treeKey;
        }
        treeInit();
    }
    
    return menu;    
});
