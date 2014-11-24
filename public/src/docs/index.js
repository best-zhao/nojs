/*
 * 主界面框架入口文件
 * 
 */

define(function(require){
	
	var $ = require('$'),
        ui = require('ui'),
        G = {},
        menu = require('./menu'),
        url = require('./url'),
        setUrl = url.setUrl,
        key = require('./key'),
        html = $('html');
    
    //全屏快捷键"F"    
	key.methods['70'] = function(){
        var isFull = $.localStorage.get('fullpage');
        $.localStorage.set('fullpage', isFull==1 ? 0 : 1);
        html[isFull==0 ? 'addClass' : 'removeClass']('page_full');
    };
    
    //初始状态
    ($.localStorage.get('fullpage')==1 || ui.mobile) && html.addClass('page_full');

	G = {
        '$wrap' : $('#main_content'),
        '$content' : $('#iframe_content'),
        'beforeSend' : function(){
            //beforeSend事件
            G.options.beforeSend && G.options.beforeSend();
        },
        'complete' : function(data){
            G.data = data;            
            //ui.mobile && setUrl('hideMenu', 1);
            //complete事件
            G.options.complete && G.options.complete();
        },
        '$menu' : $('#side_menu'),
        'menu' : menu
    }
    
    ui.config({
        overlay : {
            insertTo : G.$content
        },
        msg : {
            //overlay默认insertTo被改变后 msg仍默认为body对象
            insertTo : 'body'
        }
    });
    
	//框架内跳转链接
	G.jump = function(url){
	    setUrl('url', url);
	}
	
	G.$wrap.click(function(e){
        var t = e.target,
            id, act;
        
        if( t.tagName.toLowerCase()=='a' ){
            act = $(t).attr('data-act');
            
            if( act=='jump' ){//页面内链接跳转
                G.jump($(t).attr('href'));
                return false;
            }
            id = $(t).attr('data-treeid');
            
            var n = menu.items.length, m;
            if( id && n ){
                for( var i=0; i<n; i++ ){
                    m = menu.items[i];
                    if( m.data.all[id] ){
                        m.select(id);
                        break;
                    }                    
                }
                return false;
            }
        }
    }).delegate('[data-act="jumps"] a', 'click', function(e){
        G.jump($(e.target).attr('href'));
        return false;
    });
    $('#ui_page').show();

    G.init = function(options){
        G.options = options || {};
        menu.init(G);
    }
	
	
	ui.touch(function(){
	    G.$wrap.swipeRight(function(){
            G.$menu.css('left', '0');
        }).swipeLeft(function(){
            G.$menu.css('left', '-250px');
        })
	})
    return G;
});
