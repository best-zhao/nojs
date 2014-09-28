/*
 * html桌面提醒
 * 2014-4-10
 */
define(function(require){
    function DesktopNotification(options) {
        /*
         *@param {Object} options 设定消息体参数，包含三个属性（url, title, body),如果notificationStyle值为2，只需定义url属性
         *@param {Number} style 设定创建消息框方式，可取值1（纯文本方式）, 2（HTML方式） 默认为1
         *@param {Number} timeout 设定消息显示时间，单位ms, 默认为2000
        */
        this.options = options = options || {url: "", title: "", body: ""};
        this.notification = null,
        this.permissionStatue = 1,  //PERMISSION_ALLOWED: 0,  PERMISSION_NOT_ALLOWED: 1, PERMISSION_DENIED: 2
        this.notificationStyle = options.style || 1, 
        this.displayTime = options.timeout || 5000,
        this.content = null;
    }
    
    DesktopNotification.prototype = {
        constructor: DesktopNotification,
        checkSupport: function(){
            this.notification = window.Notifications || window.webkitNotifications;
        },
    
        requestPermission: function(){
            this.notification.requestPermission();
            this.permissionStatue = this.notification.checkPermission();
        },
    
        checkPermissionStatue: function(){
            if(this.permissionStatue == 0){
                this.notificationContent();
            }                
        },
    
        notificationContent: function(){
            var self = this;
            switch(this.notificationStyle){
                case 1 :
                    this.content = this.notification.createNotification(this.options.url, this.options.title, this.options.body);
                    break;
                case 2 :
                    this.content = this.notification.createHTMLNotification(this.options.url);
                    break;
                default :
                    alert('Sorry, you have not defined the notificationStyle.');
            };
    
            this.content.onshow = function(){
                setTimeout(function(){
                    self.content.cancel();
                }, self.displayTime)
            }
            this.content.show();
            setTimeout(function(){
                self.content.cancel();
            }, self.displayTime)
        },
    
        init: function(){
            this.checkSupport();
            if( this.notification ){
                this.requestPermission();
                this.checkPermissionStatue();
            }else {//ie
                var d = document.createElement("script");   
                d.type = "text/vbscript";  
                d.text = "Function noticeie(title,body) MsgBox body,64,title  End Function"; 
                var head = document.getElementsByTagName("head")[0] ||document.documentElement;  
                head.appendChild(d);  
                try{  
                    noticeie(this.options.title, this.options.body);  
                }catch(e){
                    //console.log(e)
                }  
            }
        }
    
    }
    
    return DesktopNotification;
})
