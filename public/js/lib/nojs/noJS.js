/*nolure@vip.qq.com*/!function(window,undefined){function type(a){return null==a?String(a):Object.prototype.toString.call(a).slice(8,-1).toLowerCase()}function resolve(a,b,c){var d=type(a);if(b=b||0,"array"==d){var e,f=[];for(e=0;e<a.length;e++)f.push(resolve(a[e],b,c));return f}if("string"!=d||!a.length)return"";/\/$/.test(a)&&(a+="index");var g=Config.alias||{},h=a=g[a]?g[a]:a;return c=c||Loader.point||Config.base,/^(http|\/|file)/.test(a)?resolve.fix(a):/^\.\//.test(a)?1==b?(a=a.replace(/^\.\//,""),resolve.fix(a,h)):relativePath(h,c):/^\.{2}\//.test(a)?1==b?resolve.fix(a):relativePath(a,c):resolve.fix(Config.base+a,h)}function relativePath(a,b){var c=a;a=a.replace(/^\.\//,"");var d=a.indexOf("../"),e=a.lastIndexOf("../"),f=0==b.indexOf("http")?3:1,g=e/3+1;if(0>d)return a=b.split("/").slice(0,-1).join("/")+"/"+a,resolve.fix(a,c);if(b=b.split("/"),a=a.replace(/^(\.{2}\/)+/,""),len=b.length,!(len>f&&len>g))return a=3==f?b.join("/"):b[0]+"/"+a,resolve.fix(a,c);for(i=0;i<g+1;i++)b.pop();return b=b.join("/"),b=""==b?"":b+"/",a=b+a,resolve.fix(a,c)}function Loader(a){function b(a){if(a){Loader.point=a;var b=document.createElement("script");b.async=!0,Loader.event(b,function(){"function"==typeof Modules.get(a).success&&Modules.get(a).success(),c(this,1,a)},function(){c(this,2,a)}),b.src=a,head.appendChild(b)}}function c(a,c,d,e){j++;var h=Modules.get(d);(e||!h.cmd)&&Branch.check(k,0),h.state=1,j>=i?(g&&g(),Loader.state=null,Loader.begin()):a&&b(f[j])}var d,e,f=a[0],g=a[1],h=a[2]||{},i=f.length,j=0,k=h.bid;for(d=i-1;d>=0;d--)e=f[d],Modules.get(e)?(f.splice(d,1),i--,j--,c(null,1,e,1)):Modules.set(e,{id:e,bid:k});i=f.length,i&&b(f[0])}function parseRequire(a){var b=[],c=/"(?:\\"|[^"])*"|'(?:\\'|[^'])*'|\/\*[\S\s]*?\*\/|\/(?:\\\/|[^\/\r\n])+\/(?=[^\/])|\/\/.*|\.\s*require|(?:^|[^$])\brequire\s*\(\s*(["'])(.+?)\1\s*\)/g,d=/\\\\/g;return a.replace(d,"").replace(/\//g,"%2F").replace(c,function(a,c,d){d&&b.push(d.replace(/%2F/g,"/"))}),b}function use(a,b,c){function d(a){b&&b.apply(null,a)}if(!a||"string"!=typeof a)return noJS;if(use.defer)return use.defer.push(Array.prototype.slice.call(arguments)),noJS;a=a.replace(/\s/g,"").split(","),"object"==type(b)&&(c=b,b=null),c=c||{};var e=c.async;a=resolve(a,e?0:1,e);var f=[].concat(a),g=Branch.length++;return Branch[g]={callback:d,modules:f,branches:a.length},c.bid=g,Loader.push(a,null,c),noJS}function depsToExports(a){var b,c,d=[];if(!a)return d;for(c=0;c<a.length;c++)b=Modules.get(a[c]),b&&(getExports(b),d.push(b.exports));return d}function getExports(a){return a.init?a.exports:(a.exports=a.exports===undefined?("function"==type(a.factory)?getExports.run(a):a.factory)||{}:a.exports,a.exports)}function getSrc(a){return a.hasAttribute?a.src:a.getAttribute("src",4)}if(!window.noJS){var noJS=window.noJS={version:"2.0"},Config={fix:".js",alias:{},update:{}},Modules={data:{},get:function(a){return a&&this.data[a.split("?")[0]]},set:function(a,b){return a=a.split("?")[0],this.data[a]=b}},Branch=[],head=document.getElementsByTagName("head")[0];Branch.check=function(a,b){var c=Branch[a];if(c){var d=c.branches+=b-1;if(0>=d){var e=depsToExports(c.modules);c.callback&&c.callback(e),Branch[a]=null}}},resolve.fix=function(a){var b=Config.fix,c="",d=Config.version||{},c=d.base||"";return/\.(js|json)$|\?|#/.test(a)&&(a=a.replace(/#$/,""),b=""),a+=b,d.modules&&d.modules[a]&&(c=d.modules[a]),c&&(c=(/\?/.test(a)?"&":"?")+"_v="+c),a+c},Loader.fileItem=[],Loader.point=null,Loader.state=null,Loader.push=function(a,b,c){"array"==type(a)&&a.length&&(Loader.fileItem[c&&c.front?"unshift":"push"]([a,b,c]),Loader.begin())},Loader.begin=function(){!Loader.state&&Loader.fileItem.length&&(Loader.state=!0,Loader(Loader.fileItem.shift()))},Loader.event=function(a,b,c){function d(a){a.onreadystatechange=a.onload=a.onerror=null,head.removeChild(a)}a.onload=a.onreadystatechange=function(){/^(?:loaded|complete|undefined)$/.test(this.readyState)&&(b&&b.call(this),d(this))},a.onerror=function(){c&&c.call(this),d(this)}},window.define=function(){var a,b=Array.prototype.slice.call(arguments),c=b.slice(-1)[0],d=b.length>2&&b[1],e=type(c),f=b.length>2&&"string"==typeof b[0]?resolve(b[0],0,Config.base):Loader.point,g=Modules.get(f),h=Modules.get(Loader.point),i=h.bid;if(!g){if(!f||f==Loader.point)return;g=Modules.set(f,{id:f,bid:h.bid,state:1})}if(g.factory=c,g.cmd=1,"function"==e){if(d||(d=parseRequire(c.toString())),a=d.length,d=resolve(d,0,f),g.deps=d,f==Loader.point)h._deps=[].concat(d),h.success=function(){var a=h._deps.length;Branch.check(i,a);for(var b=a-1;b>=0;b--)Loader.push([h._deps[b]],null,{bid:i,front:!0});delete h._deps,delete h.success};else for(var j=0,k=h._deps,l=k.length;l>j;j++)if(f==k[j]){k.splice(j,1);break}}else g.exports=c,Branch.check(i,0)},define.cmd={},noJS.config=function(a){for(var b in a)noJS.config[b]=Config[b]=a[b];if(Config.version&&Config.version.modules)for(var b in Config.version.modules){var c=resolve(b,Config.base).split("?")[0],d=Config.version.modules[b];delete Config.version.modules[b],Config.version.modules[c]=d}return use(a.global,null,{front:!0}),noJS},noJS.use=use;var _css={};noJS.css=function(a){var b=type(a);if("array"==b){for(var c=0;c<a.length;c++)noJS.css(a[c]);return noJS}if("string"!=b||_css[a])return noJS;var d=document.createElement("link");return d.href=a,d.setAttribute("rel","stylesheet"),head.appendChild(d),_css[a]=1,noJS},getExports.run=function(a){function require(a){var b;return a=resolve(a,0,d),b=Modules.get(a),b&&getExports(b)}var b={},c=[require,b,a],d=a.id;require.async=function(){var a=arguments[0],b=arguments[1],c=arguments[2]||{};c.async=d,use(a,b,c)};var e=a.factory.apply(null,c),f=e||a.exports||b;return delete a.factory,f},!function(){var script=document.getElementsByTagName("script"),length=script.length,i,src;for(i=0;length>i;i++)src=getSrc(script[i]),src&&Modules.set(src,{id:src});var nojsScript=document.getElementById("nojs")||script[length-1],nojsSrc=getSrc(nojsScript),_config=nojsScript.getAttribute("data-config");Config.base=nojsSrc.split("/").slice(0,-2).join("/")+"/",_config&&(_config=_config.split("?")[0],/\.js$/.test(_config)?(use.defer=[],Loader.push([resolve(_config)],function(){if(use.defer){var a=[].concat(use.defer);use.defer=null;for(var b=0;b<a.length;b++)use.apply(null,a[b])}})):(_config=eval("({"+_config+"})"),noJS.config(_config)))}()}}(this);