define(function(require){
    var $ = require('$'),
        url = require('./url'),
        setUrl = url.setUrl,
        docs = require('./index'),
        Switch = require('../lib/nojs/mods/Switch');

    var $demo;
    function demo(){
        $demo = $([
            '<div id="demo_content" class=""><div class="d_wrap">',
                '<div class="d_close nj_ico n_i_close">×</div>',
                '<div class="d_content clearfix"></div>',
            '</div></div>'
        ].join('')).appendTo(docs.$wrap);
        $demo.find('div.d_close').click(function(){
            demo.hide();
        })
        demo.$content = $demo.find('div.d_content');
    }   
    demo.show = function(index){
        if( !window.demoAction ){
            return;
        }
        index = index || 0;

        !$demo && demo();
        docs.$wrap.addClass('demo_wrap');
        setTimeout(function(){
            $demo.addClass('d_open');
        }, 200)
        demo.tab ? demo.tab.change(index) : demo.render(index);
        demo.isOpen = 1;
    }
    demo.hide = function(){
        docs.$wrap.removeClass('demo_wrap');
        $demo.removeClass('d_open');
        demo.isOpen = null;
        setUrl('demo', null);
    }
    demo.render = function(index){
        var data = window.demoAction.item, html = {menu:'',content:''}, i=0, n = data.length;

        for( ; i<n; i++ ){
            html.menu += '<li class="nj_s_m">demo'+(i+1)+'</li>';
            html.content += '<div class="nj_s_c">'+data[i].content+'</div>';
        }
        html.menu = '<ul class="nj_s_menu demo_tab clearfix">'+html.menu+'</ul>';
        html.content = '<div class="nj_s_con clearfix">'+html.content+'</div>';

        demo.$content.html((window.demoAction.html||'')+html.menu + html.content);

        demo.tab = new Switch.tab(demo.$content, {
            mode : 'click',
            firstIndex : index,
            onChange : function(index){
                demo.index = index;
                if( data[index].callback ){
                    data[index].callback();
                    delete data[index].callback;
                }
                window.demoAction.onChange && window.demoAction.onChange(index);
                setUrl('demo', index);
            }
        });
    }
    demo.destroy = function(){
        $demo && demo.$content.empty();
        window.demoAction = demo.tab = null;
    }

    url.onHashChange.push(function(e, data){
        var key = data.key, index = setUrl('demo');

        if( key != 'demo' ){
            return;
        }        
        if( index  ){
            if( demo.isOpen ){
                demo.tab && index!=demo.index && demo.tab.change(index);
            }else{
                demo.show();
            }
        }else{
            demo.hide();
        }
    })

    docs.$wrap.delegate('a[data-action]', 'click', function(){
        var act = $(this).data('action');
        if( act=='demo' ){
            demo.show($(this).data('index'));
        }
        return false;
    })

    return demo
})