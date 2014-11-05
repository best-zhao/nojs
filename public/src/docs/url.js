define(function(require){
    var $ = require('$'),
        data = {},
        ieHashSupport = $.browser.ie && parseFloat($.browser.version)<8;
    
    if( ieHashSupport ){
        var iframe = $('<iframe id="hashIframe" name="hashIframe" style="display:none;position:absolute"></iframe><a target="hashIframe"></a>').appendTo(document.body),
            Iframe, hashLink = iframe[1];
        
        Iframe = iframe[0].contentWindow;
        iframe = Iframe.document;
        
        iframe.open();
        iframe.write('<a href="" style="display:block;width:100px;height:500px"></a>');
        iframe.close();
        iframe = $(iframe.body);
        iframe.css({height:'1px',overflow:'scroll'});
    }
    
    
    data.onHashChange = [];
    
    
    
	function setUrl(key, value){
	    //@value: null清空参数undefined获取参数值 否则设置参数值
	    
		var hash = location.hash.replace(/^#/,'').split('&'),
            i, m, _hash = {}, group = $.type(key)=='object';
            
		key = key || 'id';
	    
		for( i=0; i<hash.length; i++ ){
		    if( !hash[i] ){
		        continue;
		    }
		    m = hash[i].split('=');		    
		    _hash[m[0]] = m[1];	    
		    
		}
		
		if( group ){
            setUrl.group($.extend({}, _hash, key));
            return;
        }
		
		//没有改变
		if( value==_hash[key] ){
			return _hash[key];
		}
		
		if( value===null ){//delete
		    delete _hash[key];
		}else if( value===undefined ){//get
		    _hash[key] = _hash[key] && decodeURIComponent(_hash[key]);

            return _hash[key] && decodeURIComponent(_hash[key]);//执行2次decodeURIComponent for firefox
        }else{//set
            _hash[key] = value && encodeURIComponent(value);
		    _hash[key] = encodeURIComponent(_hash[key]);
		}
		
		hash = [];	
		for( i in _hash ){
		    hash.push(i+'='+_hash[i]);
		}
		setUrl.call && setUrl.call();
		
        goHash(hash.join('&'));
        
	}
	/*
	 * 批量处理多个key/value
	 */
	setUrl.group = function(data){
	    var hash = [];
        for( var i in data ){
            data[i] && hash.push(i+'='+data[i]);
        }
        hash = hash.join('&');
        
        //没有改变
        if( '#'+hash==location.hash ){
            return;
        }
        
        
        setUrl.call && setUrl.call();
        goHash(hash);
	}
	function goHash(hash){
	    if( ieHashSupport ){
            if( !Iframe.document.getElementById(hash) ){
                iframe.append('<a id="'+hash+'" style="display:block;width:1px;height:1px"></a>');
            }
            hashLink.href = '#'+hash;
            hashLink.click();
        }
        
    
        location.hash = hash;
	}
	
	data.setUrl = setUrl;
	function getChange(e){
	    var newHash = getChange.hash(e.newURL),
            oldHash = getChange.hash(e.oldURL),
            key, i;
        
        for( i in newHash ){
            if( newHash[i]!=oldHash[i] ){
                key = i;
                break;
            }
        }
        if( !key ){
            for( i in oldHash ){
                if( newHash[i]!=oldHash[i] ){
                    key = i;
                    break;
                }
            }
        }
        return key;
	}
	getChange.hash = function(url){
        var hash, rect = {}, i = 0, m;
        if( !url ){
            return rect;
        }
        hash = url.split('#')[1];
        
        if( hash ){
            hash = hash.split('&');
        }else{
            hash = [];
        }
        for( ; i<hash.length; i++ ){
            m = hash[i].split('=');
            rect[m[0]] = m[1];
        }
        return rect;
    }
    data.getChange = getChange;
    
	if( typeof onhashchange!='undefined' ){
        var i, n, _data, event = data.onHashChange,
        oldUrl = location.href,
        Hashchange = function(e){
            e = e || window.event;
            //console.log(e.oldURL,oldUrl)
            //for ie
            e.oldURL = e.oldURL || oldUrl;
            e.newURL = e.newURL || location.href;
            oldUrl = e.newURL;
            
            //console.log(e.newURL)
            n = event.length;
            _data = {};
            _data.id = setUrl();
            _data.key = getChange(e);
            
            for( i=0; i<n; i++ ){
                event[i](e, _data);
            }
        }
        
        
        if( ieHashSupport ){
            $(Iframe).on('scroll', function(e){
                Hashchange(e);
            })
        }else{
            window.onhashchange = Hashchange;
        }
        
    }
	return data;
});