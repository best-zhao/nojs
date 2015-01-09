define(function(require){
    var $ = require('$'),
        ui = require('ui'),
        docs = require('./'),
        codeLight = require('../lib/nojs/mods/codelight'),
        layer = require('../lib/nojs/mods/layer'),
        demo = require('./demo'),
        url = require('./url'),
        setUrl = url.setUrl;

    ui.config({
        msg : {
            onContent : function(content){
                var loading = this.content.find('.n_i_loading');
                loading.length && require.async('lib/nojs/mods/icon', function(icon){
                    new icon(loading, {
                        type : 'loading'
                    });
                })
            }
        }
    })

    var menuKey = 'nojsMenuData',
        data = $.localStorage.get(menuKey);

    if( data ){
        data = JSON.parse(data);
        menuInit(data);
    }else{
        //domain.rs+'/src/docs/config.json'
        $.getJSON('/getMenus', function(json){
            menuInit(json.data);
            $.localStorage.set(menuKey, JSON.stringify(json.data));
        })
    }    

    function menuInit(data){
        data.forEach(function(m){
            if( m.content ){
                m.link = '/docs_'+m._id;
            }
        });
        docs.init({
            menu : {nojs:{data:data}},
            treeKey : {
                id : '_id',
                parent : 'pid'
            },
            defaultNode : data[0]._id,
            beforeSend : function(){
                //docs.$content.fadeTo(200, 0);
                demo.destroy();
            },
            complete : function(){
                //docs.$content.stop().fadeTo(400, 1);
                new codeLight({parent:docs.$wrap});
                operat.hide();

                var demoIndex = setUrl('demo');
                demoIndex && demo.show(demoIndex);
            }
        });
    }

    

    var $operat = $('#operating .inner_btn'),
    operat = new layer.overlay({
        position : {right:0},
        insertTo : 'body'
    });
    operat.set('content', $('#op_menu').show());
    operat.on({
        mode : 'click',
        element : $operat
    })
    operat.content.find('.demo').click(function(){
        operat.hide();
        demo.show();
    })

});