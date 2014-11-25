
exports.init = function(app){
    app.get('/', function(req, res){
      res.render('index', { title: 'Express' });
    })

    app.get('/docs', function(req, res){
      res.render('docs/index', { title: 'nojs docs' });
    })

    require('./menu').init(app);
}