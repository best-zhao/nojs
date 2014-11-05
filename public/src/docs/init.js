define(function(require){
    var $ = require('$'),
        docs = require('./'),
        codeLight = require('../lib/nojs/mods/codelight'),
        layer = require('../lib/nojs/mods/layer'),
        demo = require('./demo'),
        url = require('./url'),
        setUrl = url.setUrl;

    docs.init({
        menu : domain.rs+'/src/docs/config.json',
        defaultNode : 'nojs_info',
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