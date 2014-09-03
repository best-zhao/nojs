/**
 * >init
 */
test('use init',  function(){
    stop();
    noJS.use('pj/init', function(init){
        deepEqual(init, {
            init : 'init'
        })
        start();
    });
})

/**
 * 加载非标准模块
 */
test('加载非标准模块', function(){
    stop();
    noJS.use('pj/noncmd', function(){
        ok(window.noncmd===11, 'noncmd module completed!');
        start();
    });
})

/**
 * 加载多个模块
 * 非标准+标准
 */
test('非标准+标准混合加载', function(){
    stop();
    noJS.use(['pj/noncmd','pj/init'], function(noncmd, init){
        ok(window.noncmd===11, 'noncmd module completed!');
        deepEqual(init, {
            init : 'init'
        })
        start();
    });
})