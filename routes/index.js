
/*
 * GET home page.
 */

exports.index = function(req, res){
  res.render('index', { title: 'Express' });
};

var mongoose = require('mongoose');
//local: mongodb://localhost/todo_development
mongoose.connect('mongodb://localhost/nojs', function(err){
    if( err ){
        throw err
    }else{
        console.log('connected to Mongodb')
    }
})
function validate(value){
    return value && value.length;
}
var Schema = mongoose.Schema,
    //ObjectId = Schema.ObjectId,
    Menu = new Schema({
        name : {type:String, validate:[validate, 'menu name is required']},
        pid : String
    });
Menu = mongoose.model('menu', Menu);

exports.init = function(app){
    //admin 
    app.get('/a', function(req, res){
        res.render('admin/index', { title: 'admin' });
    });

    //菜单管理
    app.get('/a/menu', function(req, res){
        Menu.find({}, function(err, data){
            var d = {
                title : '菜单管理',
                menus : data,
                menu : {name:'',_id:''}
            }
            req.xhr ? res.send({
                status : 1,
                data : data.map(function(d){
                    return {name:d.name,_id:d._id,pid:d.pid}
                })
            }) : res.render('admin/menu', d)
        }) 
    });
  

    //aciton添加/编辑菜单
    app.post('/a/menu/add', function(req, res){
        var data = req.body;

        if( data._id ){//edit
            Menu.findById(data._id, function(err, m){
                m.name = data.name;
                m.pid = data.pid;
                m.save(function(err){
                    if(err){
                        throw err;
                    }else{
                        res.redirect('/a/menu');
                    }                    
                })
            }) 
        }else{//add
            var menu = {name:data.name, pid:data.pid||-1};
            menu = new Menu(menu); 

            menu.save(function(err){
                if( err ){
                    res.redirect('/a');
                }else{
                    res.redirect('/a/menu');
                }
            })   
        }
    });

    //编辑菜单
    app.get('/a/menu/:id', function(req, res){
        Menu.find({}, function(err, data){
            var d = {
                title : '编辑菜单',
                menus : data
            }
            data.forEach(function(m){
                if( m._id==req.params.id ){
                    d.menu = m;                    
                }
            })
            res.render('admin/menu', d);
        }) 
    })

    //action删除菜单
    app.get('/a/menu/del/:id', function(req, res){
        Menu.findById(req.params.id, function(err, data){
            if( data ){
                data.remove(function(){
                    res.redirect('/a/menu');
                })
            }
        })
    })
}