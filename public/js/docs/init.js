/*nolure@vip.qq.com*/define("docs/init",["lib/jquery/jquery","lib/nojs/ui","./","../lib/nojs/mods/codelight","../lib/nojs/mods/layer","./demo","./url","./index","./menu","../lib/nojs/mods/tree","./key","../lib/nojs/mods/Switch"],function(require){function a(a){a.forEach(function(a){a.content&&(a.link="/docs_"+a._id)}),d.init({menu:{nojs:{data:a}},treeKey:{id:"_id",parent:"pid"},defaultNode:a[0]._id,beforeSend:function(){g.destroy()},complete:function(){new e({parent:d.$wrap}),m.hide();var a=i("demo");a&&g.show(a)}})}var b=require("lib/jquery/jquery"),c=require("lib/nojs/ui"),d=require("./"),e=require("../lib/nojs/mods/codelight"),f=require("../lib/nojs/mods/layer"),g=require("./demo"),h=require("./url"),i=h.setUrl;c.config({msg:{onContent:function(){var a=this.content.find(".n_i_loading");a.length&&require.async("lib/nojs/mods/icon",function(b){new b(a,{type:"loading"})})}}});var j="nojsMenuData",k=b.localStorage.get(j);k?(k=JSON.parse(k),a(k)):b.getJSON("/getMenus",function(c){a(c.data),b.localStorage.set(j,JSON.stringify(c.data))});var l=b("#operating .inner_btn"),m=new f.overlay({position:{right:0},insertTo:"body"});m.set("content",b("#op_menu").show()),m.on({mode:"click",element:l}),m.content.find(".demo").click(function(){m.hide(),g.show()})}),define("lib/nojs/mods/codelight",["lib/jquery/jquery"],function(require){var $=require("lib/jquery/jquery"),codeLight=function(a){this.opt=a=a||{},this.parent=a.parent||"body",this.box=null,this.code=[],this.init()};return codeLight.prototype={init:function(){function delLine(a){item=a.find(".rs_item li"),first=item.first(),last=item.last(),""==first.html().replace(/\s/g,"")&&first.remove(),""==last.html().replace(/\s/g,"")&&last.remove(),item=a.find(".rs_item li"),""==item.first().html().replace(/\s/g,"")&&delLine(a)}function delTab(a){if(first=a.first(),s.test(first.html())){var b,c,d=a.length;for(c=0;d>c;c++)b=a.eq(c),b.html(b.html().replace(s,""));s.test(first.html())&&delTab(a)}}function setKey(key,code){if(!key||!key.length)return code;for(var j=0;j<key.length;j++)code=code.replace(eval("/("+key[j]+")/g"),'<b class="key">$1</b>');return code}var m,code,box,type,C=this.parent.find("script[code]"),s=/\s{4}/,item,first,last,key;if(C.length)for(var i=0;i<C.length;i++)m=C.eq(i),type=m.attr("code"),key=m.attr("key"),key&&(key=key.split(",")),code=m.html()||m.val(),""!=code.replace(/\s/g,"")&&(code=this.str(code,type),code=setKey(key,code),m.css({display:"none"}).after('<pre title="双击编辑" expand="'+(0==m.attr("expand")?0:1)+'" class="codelight_box"><ol class="rs_item" tabindex="-1">'+code+'</ol><p class="open">+code</p></pre>'),box=m.next("pre"),box.find(".rs_item").on("dblclick",function(){return box.hasClass("code_hide")?!1:void $(this).attr({contentEditable:!0}).addClass("edit")}).on("blur",function(){$(this).removeAttr("contentEditable").removeClass("edit")}),box.find(".note .key").removeClass("key"),this.code.push(box),delLine(box),item=box.find(".rs_item li"),delTab(item),this.setOpt(box),m.remove())},str:function(a,b){var c={L:/</g,G:/>/g,L1:/(&lt;[\/]?)/g,G1:/&gt;/g,E:/\n/g,tab:/\t/g,htmlProperty:/(class|style|id|title|alt|src|align|href|rel|rev|name|target|content|http-equiv|onclick|onchange|onfocus|onmouseover|onmouseout|type|for|action|value)=/g,htmlTag:/(&lt;[\/]?)(html|body|title|head|meta|link|script|base|style|object|iframe|h1|h2|h3|h4|h5|h6|p|blockquote|pre|address|img|a|ol|div|ul|li|dl|dd|dt|ins|del|cite|q|fieldset|form|label|legend|input|button|select|textarea|table|caption|tbody|tfoot|thead|tr|td|th|span|strong|em|i|b|option)(\s|&gt;)/g,htmlNote:/(&lt;\!--([\s\S]*?)--&gt;)/gm,jsKey:/(var|new|function|return|this|if|else|do|while|for|true|false)([\s\({;.]+)/g,jsNote:/(\/\/.*)[\r\n]/g,jsNoteP:/(\/\*([\s\S]*?)\*\/)/gm,S:/&/g};return a=a.replace(/<\/\sscript>/g,"</script>"),a=a.replace(c.S,"&amp;"),a=a.replace(c.L,"&lt;").replace(c.G,"&gt;"),"html"==b?(a=a.replace(c.htmlProperty,'<i class="property">$1</i>='),a=a.replace(c.htmlTag,'$1<i class="tag">$2</i>$3'),a=a.replace(c.htmlNote,'<i class="note">$1</i>'),a=a.replace(c.L1,'<i class="lt">$1</i>').replace(c.G1,'<i class="lt">&gt;</i>')):"javascript"==b&&(a=a.replace(/('[^'\\]*(?:\\[\s\S][^'\\]*)*'|"[^"\\]*(?:\\[\s\S][^"\\]*)*")/g,'<i class="note">$1</i>'),a=a.replace(c.jsKey,'<i class="jskey">$1</i>$2'),a=a.replace(c.jsNote,'<i class="note">$1</i></li><li>').replace(c.jsNoteP,'<i class="note">$1</i>')),a=a.replace(c.tab,"    "),a="<li>"+a.replace(c.E,"</li><li>"),a+="</li>"},setOpt:function(a){var b,c='<div class="set_opt">';c+='<a href="" class="hide">折叠</a>',c+="</div>",a.append(c),c=a.find(".set_opt"),b=c.find(".hide"),a.mouseover(function(){c.show()}).mouseout(function(){c.hide()}).click(function(a){var c=$(a.target);c.hasClass("open")&&b.click()}),b.click(function(){var b=$(this);return a.hasClass("code_hide")?(a.removeClass("code_hide").find(".open").hide(),b.html("折叠")):(a.addClass("code_hide").find(".open").show(),b.html("展开")),!1}),(this.opt.autoHide||0==a.attr("expand"))&&b.click()},select:function(a){var b,c=this.code[a||0].find(".rs_item");c.dblclick().focus().select(),window.getSelection?b=window.getSelection():document.selection&&document.selection.createRange&&(b=document.selection.createRange())}},codeLight}),define("lib/nojs/mods/layer",["lib/jquery/jquery","lib/nojs/ui"],function(require){var a=require("lib/jquery/jquery"),b=require("lib/nojs/ui"),c={};return c.overlay=function(d){d=a.extend(!0,{},b.config.overlay,d),d.className=[d.className||"",d.name||""].join(" ");var e=(d.parent?window.parent:window).document;d.insertTo="body"==d.insertTo?e.body:a(e).find(d.insertTo),c.overlay.baseConstructor.call(this,d),this.visible=!1,this.content=null,this.arrow=this.options.arrow,this.timeout=this.options.timeout,this.onShow=this.options.onShow,this.onHide=this.options.onHide,c.overlay.item.push(this),this.init()},b.config.overlay=a.extend({showClassName:"nj_overlay_show",insertTo:"body"},b.config.overlay),b.extend(c.overlay,b.align),b.extend.proto(c.overlay,{set:function(a,b,c){"content"==b?(this.content.empty().append(c),this.options.onContent&&this.options.onContent.call(this,c)):a.call(this,c)}}),c.overlay.item=[],c.overlay.hide=function(){for(var a=c.overlay.item,b=a.length,d=0;b>d;d++)a[d].hide()},c.overlay.prototype.init=function(){this.element=a('<div class="v_hide d_show nj_overlay '+this.options.className+'"><div class="nj_overlay_wrap"></div></div>').appendTo(this.options.insertTo),this.content=this.element.find(".nj_overlay_wrap"),this.arrow&&(this.arrow.element=a('<div class="nj_overlay_arrow"></div>').appendTo(this.element),this.arrow.offset=this.arrow.offset||[0,0]),this._effect=new b.effect(this.element,this.options.effect),this.bind()},c.overlay.prototype.show=function(a){if(!this.visible){var b=this;return this.element.addClass(this.options.showClassName),this.timeout&&(this.autoHide=setTimeout(function(){b.hide()},this.timeout)),this._effect.show(),this.visible=!0,this.set(),a&&a.call(this),void(this.onShow&&this.onShow.call(this))}},c.overlay.prototype.hide=function(a){this.visible&&(this._effect.hide(),this.element.removeClass(this.options.showClassName),this.autoHide=clearTimeout(this.autoHide),this.visible=!1,a&&a.call(this),this.onHide&&this.onHide.call(this))},c.overlay.prototype.on=function(c){c=c||{};var d,e,f,g,h,i,j=this,k=c.mode||b.config.eventType,l="array"==a.type(c.element)&&c.element.length>1,m=!!this.nearby,n=b.dom(l?c.element[0]:c.element)||this.nearby,o=this.options.hoverClass||"nj_overlay_show";if(n){d="mouseover"==k,i=d?" mouseout":"",e=function(b){var f,k,p,q;if(l){if(f=b.target,k=f.tagName.toLowerCase(),q=c.element[1],p=typeof q,"function"==p)q=q.call(f,k);else if("string"==p){if(q=a(f).closest(q),!q.length)return}else q=null;if(!q)return;var r=a("boolean"==typeof q?f:q);j.visible&&j.set("align",{nearby:r}),j.visible&&j.nearby.removeClass(o),j.nearby=r}else m||(n.length>1&&j.hide(),j.nearby=a(this));q=a(this),d?(h=clearTimeout(h),g=setTimeout(function(){l||m||(j.nearby=q),e.e()},50)):!i&&j.visible?j.hide():e.e(),b.preventDefault(),d||c.stopBubble===!1||b.stopPropagation()},e.e=function(){j.show(),j.nearby.addClass(o),c.callback&&c.callback.call(j)},f=function(a){a.stopPropagation(),i?!function(){g=clearTimeout(g),h=setTimeout(function(){j.hide()},10)}():j.hide()};var p=this.onHide;this.onHide=function(){p&&p.call(this),j.nearby&&j.nearby.removeClass(o)},n.on(k,e),i&&n.on(i,f),!d&&!function(){a(document).on(k,f),j.element.on(k,function(a){a.stopPropagation()})}(),d&&this.element.hover(function(){h=clearTimeout(h)},f)}},c.overlay.prototype.destroy=function(){this.element.remove()},c.mask=function(){function c(){h=a('<div id="nj_layer" class="nj_layer"></div>').appendTo(document.body),a.browser.ie&&6==parseInt(a.browser.version)&&(S=function(){h.css({width:g.width(),height:g.height()})},S(),g.on("scroll resize",S),new b.align({element:h})),a.onScroll(h[0]),i.element=h,f=new b.effect(h)}function d(){!document.getElementById("nj_layer")&&c(),h.addClass("nj_layer_show"),f.show()}function e(){h&&f&&(h.removeClass("nj_layer_show"),f.hide())}var f,g=a(window),h=a("#nj_layer"),i={show:d,hide:e};return i}(),c.popup=function(d){d=a.extend(!0,{},b.config.popup,d),d.name=["nj_win",d.name||""].join(" "),d.nearby=d.nearby||(d.parent?window.parent:window),c.popup.baseConstructor.call(this,d),this.theme=d.themeItem[d.theme],this.close=null,this.title=null,this.operating=null,this.mask=0==d.mask?!1:!0,this.bindEsc=0==d.bindEsc?!1:!0,this.onShow=d.onShow,this.onHide=d.onHide,this.create()},b.config.popup={themeItem:{"default":{button:{base:"nj_btn",submit:"n_b_sb"}}},width:400,theme:"default",className:"drop_pop",showClassName:"drop_pop_show"},b.extend(c.popup,c.overlay),b.extend.proto(c.popup,{set:function(a,b,c){if("title"==b)c&&this.title.html(c).show();else if("button"==b){if(this.button=[],this.operating.empty()[c?"show":"hide"](),c)for(var d=0;d<c.length;d++)this.addBtn.apply(this,c[d])}else a.call(this,b,c)},show:function(a,b){this.visible||(this.mask&&c.mask.show(),a.call(this,b),this.bindEsc&&!c.popup.focus[this.key]&&(c.popup.focus[this.key]=this))},hide:function(b,d){if(this.visible){var e=this,f=this.mask;(!this.onbeforehide||this.onbeforehide())&&(b.call(e,d),this.mask&&a.each(c.popup.item,function(){return this.key!=e.key&&this.visible&&this.mask?(f=!1,!1):void 0}),f&&c.mask.hide(),delete c.popup.focus[this.key])}}}),c.popup.prototype.create=function(){var d=this,e="nj_popup_"+ +new Date;c.popup.item[e]=this,this.key=e,this.set("content",['<span class="win_close nj_ico n_i_close">×</span><div class="win_tit"></div>','<div class="win_con clearfix"></div>','<div class="win_opt"></div>'].join("")),this.content.addClass("win_wrap"),this.options.fullScreen?(this.element.css({width:"100%",height:"100%"}),this.position={top:0,left:0},this.element.addClass("full_pop"),this.layer=null):this.element.css({width:this.options.width}),this.element[0].id=e,this.close=this.element.find(".win_close"),this.title=this.element.find(".win_tit").hide(),this.content=this.element.find(".win_con"),this.operating=this.element.find(".win_opt").hide(),this.close.on(b.config.clickEvent,function(){d.hide()}),this.bindEsc&&!c.popup.bind.init&&c.popup.bind(),a.onScroll(this.element[0])},c.popup.prototype.addBtn=function(c,d,e){if(void 0!==c){this.operating.is(":hidden")&&this.operating.show(),this.button=this.button||[];var f=this,g="string"==typeof c&&/[<>]/.test(c),h=a(g?c:'<a href=""></a>'),e=e?e:"",i=this.theme.button||{};"string"==typeof d&&"close"!=d&&(e=d,d=null),!g&&h.attr({"class":"no"==e?"":i.base+" "+(i[e]||"")}),!g&&h.html(c),this.operating.append(h),this.button.push(h),d&&(d="close"==d?function(){f.hide()}:d,h.on(b.config.clickEvent,function(){return d.call(f),!1}))}},c.popup.item={},c.popup.clear=function(a){function b(a){a.self.remove(),a=null}if(a){var d=c.popup.item[a];d&&b(d)}else{for(var e in c.popup.item)b(c.popup.item[e]);c.popup.item={},c.msg.win=null}},c.popup.focus={},c.popup.bind=function(){c.popup.bind.init||(c.popup.bind.init=!0,a(document).on("keydown",function(a){if(27==a.keyCode){var b,d;for(b in c.popup.focus)d=c.popup.focus[b];d&&d.bindEsc&&d.visible&&d.hide()}}))},c.msg=function(){var d={};return b.config.msg={width:null},{show:function(e,f,g){var h="confirm"==e;g=a.extend(!0,{title:h&&"温馨提醒：",bindEsc:h?!0:!1,timeout:1500,mask:h?null:!1},b.config.msg,g);var i=g.button,j=d[e];return this.hide(!0),f=f||"","loading"==e?f=f||"正在处理请求,请稍候……":h&&(i=i||[["确定",function(){j.hide(function(){"function"==typeof g.ok&&g.ok.call(this)})},"submit"],["取消","close"]]),j&&a("#"+j.key).length||(g.name="msg_tip_win msg_tip_"+e+" "+(g.name||""),j=new c.popup(g),j.set("title",g.title),j.set("content",'<div class="con clearfix"><i class="tip_ico nj_ico n_i_'+(h?"warn":e)+'">'+(b.config.iconText[e]||"")+'</i><span class="tip_con"></span></div>'),d[e]=j,h&&(j.onShow=function(){c.mask.element.addClass("higher_layer")},j.onHide=function(){c.mask.element.removeClass("higher_layer")})),j.timeout=h||"loading"==e||g.reload?0:g.timeout,g.reload&&setTimeout(function(){g.reload===!0?location.reload():"string"==typeof g.reload&&(location.href=g.reload)},1500),!i&&j.operating.hide().empty(),j.set("button",i),j.content.find(".tip_con").html(f),j.show(),h&&j.button[0].focus(),j},hide:function(a){for(var b in d)a&&d[b].element.addClass("v_hide"),d[b].hide()}}}(),c}),define("docs/demo",["lib/jquery/jquery","docs/url","docs/index","lib/nojs/ui","docs/menu","lib/nojs/mods/tree","docs/key","lib/nojs/mods/Switch"],function(require){function a(){b=c(['<div id="demo_content" class=""><div class="d_wrap">','<div class="d_close nj_ico n_i_close">×</div>','<div class="d_content clearfix"></div>',"</div></div>"].join("")).appendTo(f.$wrap),b.find("div.d_close").click(function(){a.hide()}),a.$content=b.find("div.d_content")}var b,c=require("lib/jquery/jquery"),d=require("docs/url"),e=d.setUrl,f=require("docs/index"),g=require("lib/nojs/mods/Switch");return a.show=function(c){window.demoAction&&(c=c||0,!b&&a(),f.$wrap.addClass("demo_wrap"),setTimeout(function(){b.addClass("d_open")},200),a.tab?a.tab.change(c):a.render(c),a.isOpen=1)},a.hide=function(){f.$wrap.removeClass("demo_wrap"),b.removeClass("d_open"),a.isOpen=null,e("demo",null)},a.render=function(b){for(var c=window.demoAction.item,d={menu:"",content:""},f=0,h=c.length;h>f;f++)d.menu+='<li class="nj_s_m">demo'+(f+1)+"</li>",d.content+='<div class="nj_s_c">'+c[f].content+"</div>";d.menu='<ul class="nj_s_menu demo_tab clearfix">'+d.menu+"</ul>",d.content='<div class="nj_s_con clearfix">'+d.content+"</div>",a.$content.html((window.demoAction.html||"")+d.menu+d.content),a.tab=new g.tab(a.$content,{mode:"click",firstIndex:b,onChange:function(b){a.index=b,c[b].callback&&(c[b].callback(),delete c[b].callback),window.demoAction.onChange&&window.demoAction.onChange(b),e("demo",b)}})},a.destroy=function(){b&&a.$content.empty(),window.demoAction=a.tab=null},d.onHashChange.push(function(b,c){var d=c.key,f=e("demo");"demo"==d&&(f?a.isOpen?a.tab&&f!=a.index&&a.tab.change(f):a.show():a.hide())}),f.$wrap.delegate("a[data-action]","click",function(){var b=c(this).data("action");return"demo"==b&&a.show(c(this).data("index")),!1}),a}),define("docs/url",["lib/jquery/jquery"],function(require){function a(c,e){var f,g,h=location.hash.replace(/^#/,"").split("&"),i={},j="object"==d.type(c);for(c=c||"id",f=0;f<h.length;f++)h[f]&&(g=h[f].split("="),i[g[0]]=g[1]);if(j)return void a.group(d.extend({},i,c));if(e==i[c])return i[c];if(null===e)delete i[c];else{if(void 0===e)return i[c]=i[c]&&decodeURIComponent(i[c]),i[c]&&decodeURIComponent(i[c]);i[c]=e&&encodeURIComponent(e),i[c]=encodeURIComponent(i[c])}h=[];for(f in i)h.push(f+"="+i[f]);a.call&&a.call(),b(h.join("&"))}function b(a){f&&(g.document.getElementById(a)||h.append('<a id="'+a+'" style="display:block;width:1px;height:1px"></a>'),i.href="#"+a,i.click()),location.hash=a}function c(a){var b,d,e=c.hash(a.newURL),f=c.hash(a.oldURL);for(d in e)if(e[d]!=f[d]){b=d;break}if(!b)for(d in f)if(e[d]!=f[d]){b=d;break}return b}var d=require("lib/jquery/jquery"),e={},f=d.browser.ie&&parseFloat(d.browser.version)<8;if(f){var g,h=d('<iframe id="hashIframe" name="hashIframe" style="display:none;position:absolute"></iframe><a target="hashIframe"></a>').appendTo(document.body),i=h[1];g=h[0].contentWindow,h=g.document,h.open(),h.write('<a href="" style="display:block;width:100px;height:500px"></a>'),h.close(),h=d(h.body),h.css({height:"1px",overflow:"scroll"})}if(e.onHashChange=[],a.group=function(c){var d=[];for(var e in c)c[e]&&d.push(e+"="+c[e]);d=d.join("&"),"#"+d!=location.hash&&(a.call&&a.call(),b(d))},e.setUrl=a,c.hash=function(a){var b,c,d={},e=0;if(!a)return d;for(b=a.split("#")[1],b=b?b.split("&"):[];e<b.length;e++)c=b[e].split("="),d[c[0]]=c[1];return d},e.getChange=c,"undefined"!=typeof onhashchange){var j,k,l,m=e.onHashChange,n=location.href,o=function(b){for(b=b||window.event,b.oldURL=b.oldURL||n,b.newURL=b.newURL||location.href,n=b.newURL,k=m.length,l={},l.id=a(),l.key=c(b),j=0;k>j;j++)m[j](b,l)};f?d(g).on("scroll",function(a){o(a)}):window.onhashchange=o}return e}),define("docs/index",["lib/jquery/jquery","lib/nojs/ui","docs/menu","docs/url","lib/nojs/mods/tree","docs/key"],function(require){var a=require("lib/jquery/jquery"),b=require("lib/nojs/ui"),c={},d=require("docs/menu"),e=require("docs/url"),f=e.setUrl,g=require("docs/key"),h=a("html");return g.methods[70]=function(){var b=a.localStorage.get("fullpage");a.localStorage.set("fullpage",1==b?0:1),h[0==b?"addClass":"removeClass"]("page_full")},(1==a.localStorage.get("fullpage")||b.mobile)&&h.addClass("page_full"),c={$wrap:a("#main_content"),$content:a("#iframe_content"),beforeSend:function(){c.options.beforeSend&&c.options.beforeSend()},complete:function(a){c.data=a,c.options.complete&&c.options.complete()},$menu:a("#side_menu"),menu:d},b.config({overlay:{insertTo:c.$content},msg:{insertTo:"body"}}),c.jump=function(a){f("url",a)},c.$wrap.click(function(b){var e,f,g=b.target;if("a"==g.tagName.toLowerCase()){if(f=a(g).attr("data-act"),"jump"==f)return c.jump(a(g).attr("href")),!1;e=a(g).attr("data-treeid");var h,i=d.items.length;if(e&&i){for(var j=0;i>j;j++)if(h=d.items[j],h.data.all[e]){h.select(e);break}return!1}}}).delegate('[data-act="jumps"] a',"click",function(b){return c.jump(a(b.target).attr("href")),!1}),a("#ui_page").show(),c.init=function(a){c.options=a||{},d.init(c)},b.touch(function(){c.$wrap.swipeRight(function(){c.$menu.css("left","0")}).swipeLeft(function(){c.$menu.css("left","-250px")})}),c}),define("docs/menu",["lib/jquery/jquery","lib/nojs/ui","docs/url","lib/nojs/mods/tree"],function(require){function a(a){var b=a.link,c=a[g.key.id];if(b){var f=i("url"),h=this.box[0].id,j=(h.substring(h.indexOf("_")+1,h.length),f||b),l=document.title,m={title:a.name,url:j};l=l.indexOf(" - ")>-1?l.split(" - ")[1]:l,d.beforeSend&&d.beforeSend(m),document.title=a.name+" - "+l,this.box.siblings(".nj_tree").find("a.current").removeClass("current"),k.load(m),e.localStorage.set("lastNode",c)}}function b(){function a(a){for(var b in a)c(b,a[b])}var b=d.options.menu;"string"==typeof b?e.getJSON(b,a):a(b)}function c(a,b){var c,d,f=b.data;if("true"!=b.disable&&f){d="menu_"+a,c=e('<div id="'+d+'" class="nj_tree"></div>'),h.append(c),c.data("id",a);var i=new g(d,{data:f,onSelect:l.onSelect,defaultNode:l.defaultNode});k.items.push(i)}}var d,e=require("lib/jquery/jquery"),f=(require("lib/nojs/ui"),require("docs/url")),g=require("lib/nojs/mods/tree"),h=e("#side_menu"),i=f.setUrl,j=0,k={items:[]};f.onHashChange.push(function(a,b){var c,d=b.id,e=b.key;if(d&&("id"==e||"url"==e)&&k.items.length)for(var f=0;f<k.items.length;f++)if(c=k.items[f],c.data.all[d]){j=2,c.select(d),j=1;break}});var l={onSelect:function(b){if(!j&&i())return a.call(this,b),void(j=1);if(2==j)a.call(this,b);else{var c={id:b[g.key.id]};j&&(c.url=null),i(c),j=1}}};return k.load=function(a){a=a||d.data,e.ajax({url:a.url,type:"get",dataType:"html",headers:{noAjax:!0},success:function(b){d.$content.html(b),d.complete&&d.complete(a)}})},k.init=function(a){d=a,l.defaultNode=i()||d.options.defaultNode,d.options.treeKey&&(g.key=d.options.treeKey),b()},k}),define("lib/nojs/mods/tree",["lib/jquery/jquery"],function(require){function a(c,d){+new Date;this.box="string"==typeof c?b("#"+c):c,this.options=d=d||{},this._data=d.data,this.ajaxMode="string"==typeof this._data,a.key=b.extend({id:"id",name:"name",parent:"parent",children:"children",open:"open",link:"link"},a.key);var e=d.formatData,f="object"==b.type(e)&&"object"==b.type(e.all)&&"array"==b.type(e.level);if(d.formatData&&!function(){var a,b,c,d=e.all,f=e.level,g=f.length;for(a in d)d[a].init=1;for(a=0;g>a;a++)for(c=f[a],b=0;b<c.length;b++)c[b].init=1}(),this.data=f?e:this.ajaxMode?null:a.format(this._data),this.box.length&&(this.ajaxMode||this.data.level.length))if(this.max=d.max||a.max,this.relationChildren=0==this.options.relationChildren?!1:!0,this.relationParent=0==this.options.relationParent?!1:!0,this.radio=this.options.radio,this.ajaxMode){var g=this;this.data?this.init(null,!0,!0):a.ajax({url:this._data,tree:this,success:function(a){g.init(null,!0,!0),g.options.ajaxSuccess&&g.options.ajaxSuccess.call(g,a)}})}else this.init(null,!0,!0)}var b=require("lib/jquery/jquery");return a.key={},a.max=50,a.rootID=-1,a.ajax=function(c){c=c||{};var d=c.data,e=c.url,f=d&&d[a.key.parent];-1!=e.indexOf("?")||d||(e+="?"+a.key.parent+"="+a.rootID,f=a.rootID),b.getJSON(e,d,function(b){if(1==b.status){var d=c.tree,e=b.data;if(e&&void 0!=f){var g,h=a.key.parent;for(g=0;g<e.length;g++)e[g][h]=f}d&&e&&(d.data=a.format(e,d.data)),c.success&&c.success(e)}})},a.format=function(c,d){function e(b,c){var l,m,n,o,p,q=b.length,r=0;for(i++,l=0;q>l;l++)if(n=b[l],o=n[j.id],r++,void 0!=o&&!k[o]){if(k[o]=n,p=n[j.parent],p==a.rootID)n.level=c=0,n[f]=[];else{if(n[f]=[],!k[p]){delete k[o],r--;continue}if(k[p][f]=k[p][f]||[],k[p][f].push(o),d&&h[c])for(m=0;m<h[c].length;m++)if(h[c][m][j.id]==p){h[c][m][f]=[].concat(k[p][f]);break}n.level=c=k[p].level+1}h[c]=h[c]||[],h[c].push(k[o])}2==g&&q>r&&3>i&&e(b)}var f,g=b.type(c),h=d&&d.level?d.level:[],i=0,j=a.key,k=d&&d.all?d.all:{};return"array"==g&&c.length&&"object"==b.type(c[0])?(f=j.children,g=void 0==c[0][j.parent]?1:2,e(c,0),{all:k,level:h}):{all:k,level:h}},a.parents=function(b,c,d){var e,f=a.key.parent,g=a.key.id,h=[];if(c=c||{},b=c[b],!b)return h;for(e=b[f];(e=c[e])&&(!d||!d(e));e=e[f])h.push(e[g]);return h},a.prototype={init:function(c,d,e){var f,g,h,i,j,k,l,m,n=this,o=a.key.link,p=a.key.id,q=a.key.open,r=a.key.name,s=(a.key.parent,a.key.children),t=void 0!=c&&c!=a.rootID,u=this.data.all,v=t?u[c].level+1:0,w=t?u[c][s]:this.data.level[v],x=this.options.isCheck,y=this.ajaxMode&&this.options.level&&this.options.level-1==v,z="";t&&(u[c].init=2);{if(w.length){if(w["break"]=w["break"]||0,j="",v)for(g=0;v>g;g++)j+='<i class="line"></i>';for(f=w["break"];f<w.length;f++){if(f>=n.max+w["break"]){w["break"]+=n.max,z+='<li class="no_child more"><a href="" id="more_'+(t?c:a.rootID)+"_"+v+'" class="item" pid="'+(t?c:a.rootID)+'" data-action="more">'+j+'<i class="ico last_ico"></i><i class="folder"></i>more</a></li>';break}h=w[f],h=t?u[h]:h,k=h[p],h.init=h.init||1,z+='<li level="'+v+'">',i=h[o]?h[o]:"javascript:void(0)",l="undefined"!=typeof h[q]?'open="'+h[q]+'"':"",m=x?'<input type="checkbox" value="'+k+'" />':"",y=!h[s].length,this.ajaxMode&&(y=null,this.options.level&&this.options.level-1==v&&(y=!0),this.options.formatData&&h.ajax&&(y=!h[s].length)),z+='<a class="item'+(y?" no_child":"")+'" href="'+i+'" reallink="'+i+'" id="'+k+'" '+l+">"+j+'<i class="ico"></i>'+m+'<i class="folder"></i><span class="text">'+h[r]+"</span></a>",y||(1==h[q]||n.options.openAll?(z+='<ul data-init="true">',z+=this.init(k,!1)):z+="<ul>",z+="</ul>"),z+="</li>"}if(d){var A,B=this.box;t?(B=b(z),A=this.box.find("#"+c),A.next("ul").data("init",!0).append(B),this.addClass(A.parent())):(this.rootWrap||(this.rootWrap=b("<ul></ul>"),B.html(this.rootWrap),this.bind()),this.rootWrap.append(z),this.addClass(B,!0)),this.replaceLink(B),function(a){var b=a.find("a.item").not(".no_child");n.options.openAll&&(a.find("ul ul").show(),b.addClass("open")),b.filter(function(){return"0"==this.getAttribute("open")}).removeClass("open").next("ul").hide(),b.filter(function(){return"1"==this.getAttribute("open")}).addClass("open").next("ul").show()}(B),!this.selected&&e&&this.select(this.options.defaultNode)}return z}if(this.ajaxMode){var C=b("#"+u[c][p]);C.addClass("no_child").next("ul").remove(),C.find(".last_ico1").length&&C.find(".last_ico1").addClass("last_ico").removeClass("last_ico1")}}},bind:function(){var c,d,e,f,g=this,h=this.options.radio;this.box.off("click.tree").on("click.tree",function(i){if(f=i.target,c=b(f),d=c.parent(),"more"==c.attr("data-action")||"more"==d.attr("data-action"))c="more"==d.attr("data-action")?d:c,g.init(c.attr("pid"),!0),c.parent().remove();else if(c.hasClass("ico")&&!c.parent().hasClass("no_child"))if(c=c.parent(".item"),e=c.next("ul"),c.hasClass("open"))e&&e.is(":visible")&&e.hide(),c.removeClass("open");else{var j=c[0].id,k=g.ajaxMode,l={};2!=g.data.all[j].init&&(g.options.formatData&&g.options.formatData.all[j]&&g.options.formatData.all[j].ajax&&(k=null),l[a.key.parent]=j,k?a.ajax({url:g._data,data:l,tree:g,success:function(a){g.init(j,!0),g.data.all[j].ajax=1,g.options.ajaxSuccess&&g.options.ajaxSuccess.call(g,a,g.data.all[j])}}):g.init(j,!0)),e&&e.is(":hidden")&&e.show(),c.addClass("open")}else if(c.hasClass("folder")||c.hasClass("item")||c.hasClass("text")||c.hasClass("line")||c.hasClass("ico")){if(!g.options.onSelect)return!1;c.hasClass("item")||(c=c.parent()),g.selected==c[0].id,g.box.find("a.current").removeClass("current"),c.addClass("current"),g.options.onSelect&&g.options.onSelect.call(g,g.data.all[c[0].id]),g.selected=c[0].id}else if("input"==f.tagName.toLowerCase()&&"checkbox"==f.type){var m,n,o=c.closest("a.item").next("ul").find("input"),p=c.parents("ul");if(f.checked){if(g.options.onCheckBefore&&!g.options.onCheckBefore.call(g,g.data.all[f.value]))return!1;h&&c.closest("ul").find("input").not(f).attr("checked",!1),g.relationChildren&&o.attr("checked","checked");for(var m=0;m<p.length;m++)n=p.eq(m),(!n.find("input").not(":checked").length||h)&&g.relationParent&&n.prev("a.item").find("input").attr("checked","checked")}else g.relationChildren&&o.attr("checked",!1),g.relationParent&&p.prev("a.item").find("input").attr("checked",!1);return g.getChecked(),g.options.onCheck&&!g.options.onCheck.call(g,g.data.all[f.value],f),!0}return!1})},getChecked:function(){var a=this.box.find("input:checked");this.checked=a.length?function(){var b=[];return a.each(function(){b.push(this.value)}),b}():null},addClass:function(a,b){a=a||this.box;var c,d,e,f,g,h,i,j,k=a.find("a.item"),l=k.length;for(b&&k.eq(0).find(".ico").addClass("first_ico"),c=0;l>c;c++)if(g=k.eq(c),i=g.closest("li"),g.next("ul").length)for(!i.next().length&&g.find(".ico").addClass("last_ico1"),j=i.attr("level"),d=0;d<i.find("li").length;d++)for(h=i.find("li").eq(d).find(".line"),!i.next().length&&h.eq(j).addClass("last_line"),e=g.find(".last_line"),f=0;f<e.length;f++)h.eq(e.eq(f).index()).addClass("last_line");else!this.ajaxMode&&g.addClass("no_child"),i.next().length||g.find(".ico").addClass("last_ico")},select:function(c,d){function e(){return j.addClass("current"),i.options.onSelect&&i.options.onSelect.call(i,i.data.all[c]),i.selected=c,!1}function f(a){0>a||(n=o.eq(a),n.show().siblings("a.item").addClass("open"),f(--a))}if(c){d=d||"id";var g,h,i=this,j=this.box.find("a["+d+'="'+c+'"]').eq(0),k=this.data.all,l=a.key.parent,m=[];if(k[c]){if(!j||!j.length){if(m=a.parents(c,this.data.all,function(a){return 2==a.init}),m.length){for(g=m.length-1;g>=0;g--){for(h=k[m[g]];!h.init;)b("#more_"+h[l]+"_"+h.level).click();b("#"+m[g]).find("i.ico").click()}m=b("#"+m[0]).next()}else m=b("#"+k[c][l]).next();if(j=m.find("a["+d+'="'+c+'"]').eq(0),!j.length){for(;!k[c].init;)b("#more_"+k[c][l]+"_"+k[c].level).click();j=m.find("a["+d+'="'+c+'"]').eq(0)}}if(this.box.find("a.current").removeClass("current"),j.parents("ul").first().is(":visible"))return e();var n,o=j.parents("ul").not(":visible"),p=o.length;f(p-1),e()}}},check:function(a,c){function d(a){a&&f.data.all[a]&&(c=0==c?!1:!0,e=b("#"+a).find("input")[0],c?!e.checked&&e.click():e.checked&&e.click(),f.getChecked())}var e,f=this;"number"==typeof a||"string"==typeof a?d(a):b.each(a,function(a,b){d(b)})},open:function(a){var c;a&&this.data.all[a]&&(this.data.all[a].init="pending",c=b("#"+a),!c.hasClass("open")&&c.find(".ico").click())},replaceLink:function(a){if(b.browser.ie&&parseFloat(b.browser.version)<8){a=a||this.box;var c=a.find("a");c.each(function(){this.href=this.getAttribute("reallink",2),this.removeAttribute("reallink")})}}},a.select=function(c,d){function e(a,b){var c,d,e="";if(a&&a.length)for(c in a)d=a[c],d="string"==typeof d?m.all[d]:d,e+=g(d,b);return e}function f(a){var b,c="--";for(b=0;a>b;b++)c+="--";return c}function g(a,b){var c=d.disable&&d.disable.indexOf(a[s])>-1?'disabled="disabled"':"";return"<option "+c+' value="'+(void 0!=a[s]?a[s]:"")+'">'+(o?f(a.level):"")+a[t]+"</option>"+(o?e(a[v],b):"")}function h(f){var g,h=0,i="",l=f?m.all[f][v]:q[h],p=0==h&&o;if(l&&l.length||p){f&&(m.all[f].init=1),h=f?m.all[f].level+1:0,g=d.name?d.name[h]:"",i='<select name="'+g+'">',i+=p?'<option value="'+a.rootID+'">根目录</option>':k,i+=e(l,h),i+="</select>",i=b(i),void 0!=n[h]&&(i[0].value=n[h],n[h]=null),c.append(i),x[h]=i[0];var r={};return r[w.event]=function(){j(this,h)},r.value=i.val(),w.init?x[h]=w.init(i,r):(i[0][w.event]=r[w.event],r.value&&j(i[0],h)),!d.value&&d.level&&h+1<d.level,i}}function i(b,c){function e(){q=m.level,c?c():h()}var f=b&&b[u];return l&&(!f||f&&m.all[f].ajax)?void e():void a.ajax({url:d.data,data:b,success:function(b){f&&(m.all[f].ajax=1),b&&b.length&&(m=a.format(b,m),e()),d.ajaxSuccess&&d.ajaxSuccess(b,f,m)}})}function j(a,c){var e=a[w.value],f={},g="select"==w.element?b(a):a[w.element];f[u]=e,d.onSelect&&d.onSelect(e,m),g.nextAll(g).remove(),e!=r&&m.all[e]&&(o||d.level&&c+1>=d.level||(p&&!m.all[e].init?i(f,function(){h(e)}):h(e)))}d=d||{},a.key=b.extend({id:"id",name:"name",parent:"parent",children:"children",open:"open",link:"link"},a.key);var k,l=d.formatData,m=l?l:"string"==typeof d.data?{}:a.format(d.data),n=[].concat(d.select),o=0==d.level,p="string"==typeof d.data,q=p?[]:m.level,r=void 0!=d.empty?d.empty:"",s=a.key.id,t=a.key.name,u=a.key.parent,v=a.key.children,w=b.extend(!0,{event:"onchange",value:"value",element:"select",destroy:"destroy"},d.ui),x=[];return c&&c.length&&q?(k='<option value="'+r+'">请选择</option>',h.empty=function(a){var b=d.name?d.name[a]:"",e='<select name="'+b+'">'+k+"</select>";c.append(e)},h.bind=function(){},p?i():h(),{select:function(a){"array"==b.type(a)&&a.length&&(n=a,c.empty(),h())}}):void 0},a}),define("docs/key",["lib/jquery/jquery"],function(require){var a,b=require("lib/jquery/jquery"),c={};return c.methods={},b(document).keydown(function(b){var d=b.keyCode,e=b.target.tagName.toLowerCase();if(a=a||17==d||18==d||16==d,!a&&"input"!=e&&"textarea"!=e&&"true"!=b.target.contentEditable)for(var f in c.methods)f==d&&c.methods[f]()}).keyup(function(){a=null}),c}),define("lib/nojs/mods/Switch",["lib/jquery/jquery","lib/nojs/ui"],function(require){function a(b,c){return this instanceof a?void((this.element=d.dom(b))&&(this.menu=this.element.find(".nj_s_menu").first(),this.menuItem=this.menu.find(".nj_s_m"),this.wrap=this.element.find(".nj_s_con").first(),this.item=this.wrap.children(".nj_s_c"),this.length=this.item.length,this.length&&(this.options=c=c||{},this.mode=c.mode||d.config.eventType,this.onChange=c.onChange,this.onHide=c.onHide,this.index=this.getIndex(c.firstIndex),this.rule=c.rule||this.rule,this.options.start=this.options.start===!1?!1:!0,this.bind()))):new a(b,c)}function b(a,c){if(b.baseConstructor.call(this,a,c),this.element){this.play=null,this.time=this.options.time||5e3,this.auto=this.options.auto===!1?!1:!0,this.stopOnHover=this.options.stopOnHover===!1?!1:!0;var d=this;this.stopOnHover&&this.element.hover(function(){d.play=clearInterval(d.play)
},function(){d.start()}),this.getNum(),this.options.start&&this.start(!0)}}var c=require("lib/jquery/jquery"),d=require("lib/nojs/ui");return a.prototype={bind:function(){var a,b,d=this,e="mouseover"==this.mode?100:0;this.menuItem&&(this.menuItem.on(this.mode+".nj_switch",function(){return b=c(this),b.hasClass("current")?!1:(d.onTrigger&&d.onTrigger(),a=setTimeout(function(){d.change(d.menuItem.index(b))},e),!1)}).mouseout(function(){a=clearTimeout(a)}),this.options.start&&this.change(this.index))},getIndex:function(a){return a=parseInt(a)||0,a=a>this.length-1?0:a,a=0>a?this.length-1:a},change:function(a){if(a=this.getIndex(a),this.rule){if(this.rule.call(this,a)===!1)return!1}else this.item.eq(a).show().siblings().hide(),this.menuItem.eq(a).addClass("current").siblings().removeClass("current");this.onHide&&this.index!=a&&this.onHide.call(this,this.index),this.index=a,this.onChange&&this.onChange.call(this,a)}},d.extend(b,a),b.prototype.getNum=function(){if(!this.menu.children().length){for(var a="",b=1;b<=this.length;b++)a+='<li class="nj_s_m">'+b+"</li>";this.menu.append(a),this.menuItem=this.menu.find(".nj_s_m"),this.bind()}},b.prototype.onTrigger=function(){!this.stopOnHover&&this.start()},b.prototype.rule=function(a){this.item.eq(a).fadeIn(400).siblings().hide(),this.menuItem.eq(a).addClass("current").siblings().removeClass("current"),this.index=a},b.prototype.start=function(a){var b=this;!this.auto||this.length<2||(a&&this.change(this.index),clearInterval(b.play),b.play=setInterval(function(){b.change(++b.index)},b.time))},{tab:a,slide:b}});