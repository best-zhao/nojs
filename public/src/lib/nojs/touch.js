/*
 * touch events
 */
define(function(require){
    var $ = require('$'),
        touch = {},
        touchTimeout, 
        tapTimeout, 
        swipeTimeout,
        longTapDelay = 750, 
        longTapTimeout;

    function parentIfText(node) {
        return 'tagName' in node ? node : node.parentNode;
    }

    function swipeDirection(x1, x2, y1, y2) {
        var xDelta = Math.abs(x1 - x2), yDelta = Math.abs(y1 - y2);
        return xDelta >= yDelta ? (x1 - x2 > 0 ? 'Left' : 'Right') : (y1 - y2 > 0 ? 'Up' : 'Down');
    }

    function longTap() {
        longTapTimeout = null;
        if( touch.last ) {
            touch.el.trigger('longTap');
            touch = {};
        }
    }

    function cancelLongTap() {
        longTapTimeout && clearTimeout(longTapTimeout);
        longTapTimeout = null;
    }

    function cancelAll() {
        touchTimeout && clearTimeout(touchTimeout);
        tapTimeout && clearTimeout(tapTimeout);
        swipeTimeout && clearTimeout(swipeTimeout);
        longTapTimeout && clearTimeout(longTapTimeout);
        touchTimeout = tapTimeout = swipeTimeout = longTapTimeout = null;
        touch = {};
    }

    (function(){
        var now, delta;

        $(document)
        .on('touchstart', function(e){
            e = e.originalEvent ? e.originalEvent : e;
            now = Date.now();
            delta = now - (touch.last || now);
            touch.el = $(parentIfText(e.touches[0].target));
            touchTimeout && clearTimeout(touchTimeout);
            touch.x1 = e.touches[0].pageX;
            touch.y1 = e.touches[0].pageY;
            if (delta > 0 && delta <= 250) {
                touch.isDoubleTap = true;
            }
            touch.last = now;
            longTapTimeout = setTimeout(longTap, longTapDelay);
            
        })
        .on('touchmove', function(e){
            e = e.originalEvent ? e.originalEvent : e;
            cancelLongTap();
            touch.x2 = e.touches[0].pageX;
            touch.y2 = e.touches[0].pageY;
            if( Math.abs(touch.x1 - touch.x2) > 10 ){
                e.preventDefault();
            }
            
        })
        .on('touchend', function(e){
            e = e.originalEvent ? e.originalEvent : e;
            cancelLongTap();
            // swipe
            if ( (touch.x2 && Math.abs(touch.x1 - touch.x2) > 30) || (touch.y2 && Math.abs(touch.y1 - touch.y2) > 30) ){
                swipeTimeout = setTimeout(function() {
                    touch.direction = swipeDirection(touch.x1, touch.x2, touch.y1, touch.y2);
                    touch.el.trigger('swipe', touch);
                    touch.el.trigger('swipe' + touch.direction, touch);
                    touch = {};
                }, 0);
            }else if( 'last' in touch ){
                // normal tap
                // delay by one tick so we can cancel the 'tap' event if 'scroll' fires
                // ('tap' fires before 'scroll')
                tapTimeout = setTimeout(function() {
                    // trigger universal 'tap' with the option to cancelTouch()
                    // (cancelTouch cancels processing of single vs double taps for faster 'tap' response)
                    var event = $.Event('tap');
                    event.cancelTouch = cancelAll;
                    touch.el.trigger(event);
                    
                    
                    // trigger double tap immediately
                    if( touch.isDoubleTap ){
                        touch.el.trigger('doubleTap');
                        touch = {};
                    }else {
                        // trigger single tap after 250ms of inactivity
                        touchTimeout = setTimeout(function(){
                            touchTimeout = null;
                            touch.el.trigger('singleTap');
                            touch = {};
                        }, 250);
                    }
                }, 0);
            }
        })
        .on('touchcancel', cancelAll);

        $(window).on('scroll', cancelAll);
    })();

    ['swipe', 'swipeLeft', 'swipeRight', 'swipeUp', 'swipeDown', 'doubleTap', 'tap', 'singleTap', 'longTap'].forEach(function(m){
        $.fn[m] = function(callback){ 
            return this.on(m, callback);
        }
    })
});