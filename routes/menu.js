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
        pid : {type:String, default:'-1'},
        content : String
    });
Menu = mongoose.model('menu', Menu);

exports.init = function(app){
    //admin 
    app.get('/a', function(req, res){
        res.render('admin/index', { title: 'admin' });
    });

    //菜单管理
    app.get('/a/menu', function(req, res){
        var d = {
            title : 'menu'
        }
        res.render('admin/menu', d)
    });

    //action 获取所有菜单
    app.get('/getMenus', function(req, res){
        Menu.find({}, function(err, data){
            res.send({
                status : 1,
                data : data
            }) 
        }) 
    })

    //aciton添加/编辑菜单
    app.post('/a/menu/add', function(req, res){
        var data = req.body.menu;

        if( data._id ){//edit
            Menu.findById(data._id, function(err, m){
                for(var i in data ){
                    m[i] = data[i];
                }
                m.save(function(err){
                    if(err){
                        throw err;
                    }else{
                        res.redirect('/a/menu');
                    }                    
                })
            }) 
        }else{//add
            delete data._id;
            var menu = new Menu(data); 

            menu.save(function(err){
                if( err ){
                    res.redirect('/a');
                }else{
                    res.redirect('/a/menu');
                }
            })   
        }
    });

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

    //view显示
    app.get('/docs_:id', function(req, res){
        Menu.findById(req.params.id, function(err, data){
            if( data ){
                res.send(data.content);
            }
        }) 
    })
}