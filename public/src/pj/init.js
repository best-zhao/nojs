define(function(require, exports, module){
    require('./a')
    require('pj/noncmd');    

    function async(){
        require.async('./async', function(a){
            console.log('callback:'+a)
        })
    }
    async();
    async();
    async();

    exports.init = 'init';
    console.log('init.js')
});