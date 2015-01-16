window.domain = {
    rs : 'http://127.0.0.1:2000'
}
!function(){
    var _dev = /[?&]nojs-debug=(true|false)(?:&|$|#)/.exec(location.href),
        dev = domain.rs.indexOf('herokuapp.com')<0;
    if( _dev ){
        dev = _dev[1]=='true';
    }
    noJS.config({
        base : domain.rs+(dev?'/src/':'/js/'),
        global : 'global',
        alias : {
            '$' : 'lib/jquery/jquery',
            'ui' : 'lib/nojs/ui',
            'edit' : 'lib/kindeditor-4.1.10/kindeditor-min',
            'nj' : 'lib/nojs/model',
            'ng' : 'lib/angular/angular-1.3.4'
        },
        version : {
            base : '2.1',
            modules : {
                'docs/init' : '20140928',
                'global' : '2014101401'
            }
        }
    })
}();