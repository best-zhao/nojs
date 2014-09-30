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
        setUrl('full', setUrl('full') ? null : 1);
    };
	
    url.onHashChange.push(function(e, data){
        var key = data.key;
        
        if( key=='full' ){
            html[setUrl(key)=='1' ? 'addClass' : 'removeClass']('page_full');
        }else if( key=='hideMenu' ){
            html[setUrl(key)?'addClass':'removeClass']('hide_menu');
        }
    });
    
    //初始状态
    setUrl('full')=='1' && html.addClass('page_full');
    if( setUrl('hideMenu')=='1' || ui.mobile ){
        setUrl('hideMenu', 1);
        html.addClass('hide_menu');
    }
    
	G = {
        '$wrap' : $('#main_content'),
        '$content' : $('#iframe_content'),
        'beforeSend' : function(){
            //beforeSend事件
            G.options.beforeSend && G.options.beforeSend();
        },
        'complete' : function(data){
            G.data = data;
            
            ui.mobile && setUrl('hideMenu', 1);

            //complete事件
            G.options.complete && G.options.complete();
        },
        'menu' : menu
    }
    
    ui.config({
        overlay : {
            insertTo : G.$content
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
	
	return G;
	ui.touch(function(){
	    G.$wrap.swipeRight(function(){
            setMenu('show');
        }).swipeLeft(function(){
            setMenu('hide');
        })
	})
});
