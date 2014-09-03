define(function(require){
    require('./a');
    console.log('async.js');
    return 'Async'
})