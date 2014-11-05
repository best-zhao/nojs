/*
 * 公用组件：表情
 * 2013-8-2
 * nolure@vip.qq.com
 */
define(function(require){
    var $ = require('$'),
        layer = require('./layer'),
        Switch = require('./Switch');
    
	function face( options ){
		this.options = options = $.extend(true, {}, face._config, options);
		this.button = options.button;//表情选择器,JQ对象
		this.insert = $(options.insert);//表情写入对象
		if(!this.button ){return;}
		
		this.themes = [];
		
		this.pop = null;//表情显示容器
		this.item = null;
		this.init();
	}	
	
	
	face._config = {
	    themeItems : {//表情主题配置http://cache.soso.com/img/img/e200.gif
            "default" : {
                name : '默认表情',
                url : '/',
                item : {'0':'微笑','1':'撇嘴','2':'色','3':'发呆','4':'得意','5':'流泪','6':'害羞','7':'闭嘴','8':'睡','9':'大哭','10':'尴尬',
                        '11':'发怒','12':'调皮','13':'龇牙','14':'惊讶','15':'难过','16':'酷','17':'冷汗','18':'抓狂','19':'吐','20':'偷笑','21':'可爱',
                        '22':'白眼','23':'傲慢','24':'饥饿','25':'困','26':'惊恐','27':'流汗','28':'憨笑','29':'大兵','30':'奋斗','31':'咒骂','32':'疑问',
                        '33':'嘘','34':'晕','35':'折磨','36':'衰','37':'骷髅','38':'敲打','39':'再见','40':'擦汗','41':'抠鼻','42':'鼓掌','43':'糗大了',
                        '44':'坏笑','45':'左哼哼','46':'右哼哼','47':'哈欠','48':'鄙视','49':'委屈','50':'快哭了','51':'阴险','52':'亲亲','53':'吓','54':'可怜'
                },
                fix : ".gif"
            }
        }
	}
	
	face.config = function(options){
	    return $.extend(true, face._config, options);
	}
	
	face.prototype = {
		init : function(){
			var T = this;
			var options = $.extend({
                nearby : this.button,
                className : 'face_menu'
            }, this.options.overlay),

            onShow = options.onShow;

			options.onShow = function(){
				if( !this.element.data('init') ){
                    this.element.data('init',true);
                    T.loadFace();
                }
                onShow && onShow.call(this);
			}

			this.pop = new layer.overlay(options);
			this.pop.on({
				mode : 'click',
				element : this.button
			});
			
			//theme为数组显示多套表情
			var themes = this.options.themes||[];
			themes = typeof themes=='string' ? [themes] : themes;
			
			
			$.each(themes, function(i,v){
			    var item = T.options.themeItems[v];
			    if( item ){
			        item.id = v;
			        T.themes.push(item);
			    }
			});
			
		},
		//载入表情 once
		loadFace : function(){
			var T = this,
				n = 0,
				faceMenu = '',
				faceCon = '';
			
			$.each(this.themes, function(i,v){
			    faceMenu += '<li class="nj_s_m">'+v.name+'</li>';
			    faceCon += '<div class="nj_s_c"><ul class="list clearfix '+v.id+'">';
			    for( var j in v.item ){
                    faceCon += '<li><img src="' + v.url + j + v.fix+'" data-name="'+i+'_'+v.item[j]+'" title="'+v.item[j]+'" alt="" /></li>';
                }
			    faceCon += '</ul></div>';
			});	
			
			var faceHtml = [
                '<div class="nj_face">',
                    '<div class="con">',
                        '<div class="tit"><ul class="nj_s_menu clearfix">'+faceMenu+'</ul></div>',
                        '<div class="nj_s_con clearfix">'+faceCon+'</div>',
                    '</div>',
                    '<span class="a"><em>◆</em><i>◆</i></span>',
                '</div>'
            ].join('');
			this.pop.set('content',faceHtml);
			this.tab = new Switch.tab(this.pop.content);
			
			this.item = this.pop.content.find("ul.list img");	
				
			this.pop.element.click(function(e){
				var t = e.target, text;
				if( t.tagName.toLowerCase()=='img' ){
					text = '[:'+$(t).attr("data-name")+']';
					T.insertTo(text);
					T.pop.hide();
				}
			})
		},
		//将所选表情写入到目标对象
		insertTo : function(text){
			//将表情插入到光标处
			var C = new insertOnCursor(this.insert);
			C.insertAtCaret(text);
			this.insert.focus();
			
			var data = {
			    theme : this.themes[this.tab.index],
			    text : text,
			    content : this.replaceFace(text)
			};
			this.options.onInsert && this.options.onInsert.call(this, data);
		},
		//提取表情,不传默认为当前表情插入对象val
		replaceFace : function(con, themes){
			if(!con){
			    var con = this.insert.val();
		    }
			var T = this;
			themes = themes || this.themes;
			
			$.each(themes, function(index,v){
			    var  faceArray = v.item, N, pic, item;
			    for(var i in faceArray){
			        item = faceArray[i];
                    N = index+'_'+item;
                    if( con.indexOf("[:"+N+"]")!=-1 ){
                        pic = '<img src="'+v.url+i+v.fix+'" alt="'+item+'" class="nj_face_image" title="'+item+'" />';
                        con = con.replace(eval("/\\[:"+N.replace("(","\\(").replace(")","\\)")+"\\]/g"),pic);
                    }
                }
			});			
			return con;	
		}
	}
	
	/*
	 * 在光标处插入内容
	 * @obj:支持光标插入的对象
	 */
	function insertOnCursor(obj){
		if(!obj||!obj.length){return;}
		this.textBox = obj;
		this.setCaret();
	}
	insertOnCursor.prototype = {
		//初始化对象以支持光标处插入内容    	
		setCaret: function(){   
	    	if(!$.browser.msie){return;} 
			var T = this;	        
			T.textBox.on('click select keyup',function(){
				T.textBox[0].caretPos = document.selection.createRange().duplicate();   
			}) 
	    },
		//在当前对象光标处插入指定的内容  
		insertAtCaret: function(text){
		    if( !this.textBox || !this.textBox.length ){
                return;
            }
			var textObj = this.textBox[0];
			
			if (document.all && textObj.createTextRange && textObj.caretPos) {
				var caretPos = textObj.caretPos;
				caretPos.text = caretPos.text.charAt(caretPos.text.length - 1) == '' ? text + '' : text;
			}else if (textObj.setSelectionRange) {
				var rangeStart = textObj.selectionStart;
				var rangeEnd = textObj.selectionEnd;
				var tempStr1 = textObj.value.substring(0, rangeStart);
				var tempStr2 = textObj.value.substring(rangeEnd);
				textObj.value = tempStr1 + text + tempStr2;
				var len = text.length;
				textObj.setSelectionRange(rangeStart + len, rangeStart + len);
			}else {
				textObj.value += text;
			}
		},
		//清除当前选择内容
		unselectContents: function(){   
	        if (window.getSelection) {
				window.getSelection().removeAllRanges();
			}else if (document.selection) {
				document.selection.empty();
			} 
	    },
		//选中内容  
		selectContents: function(){   
	        this.textBox.each(function(i){   
	            var node = this;   
	            var selection, range, doc, win;   
	            if((doc = node.ownerDocument) && (win = doc.defaultView) &&  typeof win.getSelection != 'undefined' &&  typeof doc.createRange != 'undefined' && (selection = window.getSelection()) && typeof selection.removeAllRanges != 'undefined') {   
	                range = doc.createRange();   
	                range.selectNode(node);   
	                if(i == 0){selection.removeAllRanges();}   
	                selection.addRange(range);   
	            }else if (document.body && typeof document.body.createTextRange != 'undefined' && (range = document.body.createTextRange())){   
	                range.moveToElementText(node);   
	                range.select();   
	            }   
	        });   
	    }      
	}
	
	return face;	
});
