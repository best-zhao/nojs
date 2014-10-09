/*
 * 倒计时
 * 2014-4-29
 * @nolure@vip.qq.com
 */
define("lib/nojs/mods/countdown", [ "lib/jquery/jquery" ], function(require) {
    var $ = require("lib/jquery/jquery");
    function countdown(el, diff) {
        if (!diff) {
            return;
        }
        var v = diff, day = parseInt(v / 60 / 60 / 24, 10), v1 = v - day * 24 * 60 * 60, hours = parseInt(v1 / 60 / 60, 10), v2 = v1 - hours * 60 * 60, minutes = parseInt(v2 / 60, 10), v3 = v2 - minutes * 60, seconds = parseInt(v3, 10), html = "";
        if (seconds < 0) {
            el.text("已结束");
            return;
        }
        function GetTime() {
            if (day > 0) {
                day = day < 10 ? "0" + day : day;
                html = '<em class="d">' + day + "</em><i>天</i>";
            }
            if (hours > 0 || day) {
                hours = hours < 10 ? "0" + hours : hours;
                html += '<em class="d">' + hours + "</em><i>时</i>";
            }
            if (minutes > 0 || hours) {
                minutes = minutes < 10 ? "0" + minutes : minutes;
                html += '<em class="d">' + minutes + "</em><i>分</i>";
            }
            if (seconds >= 0) {
                seconds = seconds < 10 ? "0" + seconds : seconds;
                html += '<em class="d">' + seconds + "</em><i>秒</i>";
            }
            html = $(html);
            el.html(html);
        }
        GetTime();
        function left() {
            //倒计时
            var a = html.filter("em.d"), b = a.length, A;
            if (!b) {
                return;
            }
            A = window.setInterval(function() {
                if (seconds > 0) {
                    seconds--;
                    seconds = seconds < 10 ? "0" + seconds : seconds;
                } else if (minutes > 0) {
                    minutes--;
                    minutes = minutes < 10 ? "0" + minutes : minutes;
                    seconds = 59;
                } else if (hours > 0) {
                    hours--;
                    hours = hours < 10 ? "0" + hours : hours;
                    minutes = 59;
                    seconds = 59;
                } else if (day > 0) {
                    day--;
                    day = day < 10 ? "0" + day : day;
                    hours = 23;
                    minutes = 59;
                    seconds = 59;
                } else {
                    window.clearInterval(A);
                }
                a.eq(b - 4).text(day);
                a.eq(b - 3).text(hours);
                a.eq(b - 2).text(minutes);
                a.last("").text(seconds);
            }, 1e3);
        }
        left();
    }
    return countdown;
});
