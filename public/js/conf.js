noJS.config({
    base : domain.rs+'/src/',
    global : 'global',
    alias : {
        '$' : 'lib/jquery/jquery',
        'ui' : 'lib/nojs/ui',
        '$b' : 'pj/b'
    },
    update : {
        version : '2.0',
        modules : {
            'docs/index' : '20140928'
        }
    }
});
