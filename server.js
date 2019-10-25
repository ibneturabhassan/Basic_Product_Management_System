var express = require('express');
var myParser = require("body-parser");
var session = require('express-session');
var mongoose = require('mongoose');
var md5 = require('md5');
const multer = require('multer');

// setting storage
var storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'public/uploads')
    },
    filename: function (req, file, cb) {
        cb(null, file.fieldname + '-' + Date.now()+".jpg")
    }
})

var upload = multer({ storage: storage })



var app = express();
app.use(express.static('public'));
mongoose.connect('mongodb://127.0.0.1/assignment1');
var userModel = mongoose.model('users', mongoose.Schema({username:String, password:String, user_role:Number}));
var productModel = mongoose.model('products', mongoose.Schema({username:String, name:String, desc:String, price:Number, category:String, image:String}));
var reviwModel = mongoose.model('review', mongoose.Schema({p_id:String, user:String, review:String}));


app.use(session({
    secret: 'secret',
    resave: true,
    saveUninitialized: true
}));
app.use(myParser.urlencoded({extended : true}));
app.set('view engine', 'pug');
app.set('views','./views');

//// index page
app.get('/', function (req, res) {
    console.log('login page accessed');


    if (req.session.user && req.session.pass && req.session.user_role){
        res.redirect('/home');
    }else{
        res.render('login');
    }
});

app.post('/auth', function (req, res) {
    console.log('auth start');
    var username = req.body.user;
    var password = md5(req.body.pass);
    var r = res;
    if (username && password){
        userModel.find({username:username, password:password}, function (err, reposnse) {
            if(err) throw err;
            if(reposnse.length == 1){
                //// creating session
                req.session.user = reposnse[0].username;
                req.session.pass = reposnse[0].password;
                req.session.user_role = reposnse[0].user_role;
                r.redirect('/home');
            }else{
                res.send("<script>alert('Invalid login or password!'); window.location.replace('/')</script>");
            }
        });
    }
});


app.get('/home', function (req, res) {
    console.log('home  page accessed');
    var username = req.session.user;
    var password = req.session.pass;
    var user_role = req.session.user_role;
    if(!username || !password || !user_role){
        res.redirect('/');
        res.end();

    }

    if(user_role == 1){
        productModel.find({username: username}, function (err, response) {
            if (err) throw err;
            res.render('seller_home', {products: response});

        });
    }

    if(user_role == 2){
        productModel.find({}, function (err, response) {
            if (err) throw err;
            res.render('buyer_home', {products: response});

        });
    }

    if(user_role == 3){
        userModel.find({ $or:[ {'user_role':2}, {'user_role':1}]}, function (err, response) {
            if (err) throw err;
            console.log(response);
            res.render('admin_home', {users:response});

        });
    }


});


app.get('/add-product', function (req, res) {
    console.log('add-product  page accessed');
    var username = req.session.user;
    var password = req.session.pass;
    var user_role = req.session.user_role;
    if(!username || !password || !user_role){
        res.redirect('/');
        res.end();

    }
    if(user_role == 1){
        res.render('add_product');

    }
});

app.post('/add-product', upload.single('image'), function (req, res) {
    console.log('add-product  page accessed');
    var username = req.session.user;
    var password = req.session.pass;
    var user_role = req.session.user_role;
    if(!username || !password || !user_role){
        res.redirect('/');
        res.end();

    }
    if(user_role == 1){
        var data = req.body;
        var newProduct = new productModel({username:username, name:data.name, desc: data.desc, price: data.price, category: data.category, image: req.file.filename});
        newProduct.save(function (err, result) {
            if(err) throw err;
            res.send("<script>alert('Product added!'); window.location.replace('/add-product')</script>");
        })
    }
});



app.get('/remove/:id', function (req, res) {
    console.log('remove  page accessed');
    var username = req.session.user;
    var password = req.session.pass;
    var user_role = req.session.user_role;
    if(!username || !password || !user_role){
        res.redirect('/');
        res.end();

    }
    if(user_role == 1){
        var objID = req.params.id;
        console.log(objID);
        productModel.findById(objID, function (err, response) {
            console.log(response)
            if(response && username == response.username){
                productModel.findByIdAndRemove(objID, function (err, r1) {
                    if(r1){
                        res.send("<script>alert('Product removed!'); window.location.replace('/home')</script>");
                    }else{
                        res.send("<script>alert('Cannot remove product!'); window.location.replace('/home')</script>");
                    }
                });


            }else{
                res.send("<script>alert('Cannot remove product!'); window.location.replace('/home')</script>");
            }
        });
    }
});

app.get('/update/:id', function (req, res) {
    console.log('update  page accessed');
    var username = req.session.user;
    var password = req.session.pass;
    var user_role = req.session.user_role;
    if(!username || !password || !user_role){
        res.redirect('/');
        res.end();

    }
    if(user_role == 1){
        var objID = req.params.id;
        console.log(objID);
        productModel.findById(objID, function (err, response) {
            console.log(response._id);
            if(response && username == response.username){
                res.render('seller_update', {products: response, id: response._id});
            }else{
                res.send("<script>alert('Cannot edit this product!'); window.location.replace('/home')</script>");
            }
        });
    }
});

app.post('/update_data', upload.single('image'), function (req, res) {
    console.log('update post  page accessed');
    var username = req.session.user;
    var password = req.session.pass;
    var user_role = req.session.user_role;
    if(!username || !password || !user_role){
        res.redirect('/');
        res.end();

    }

    if(user_role == 1){
        var data = req.body;
        if(req.file){
            productModel.findByIdAndUpdate(data.product_id, {name:data.name, desc: data.desc, price: data.price, category: data.category, image: req.file.filename},function (err, response) {
                res.send("<script>alert('Product updated!'); window.location.replace('/update/"+data.product_id+"')</script>");
            });
        }else{
            productModel.findByIdAndUpdate(data.product_id, {name:data.name, desc: data.desc, price: data.price, category: data.category},function (err, response) {
                res.send("<script>alert('Product updated!'); window.location.replace('/update/"+data.product_id+"')</script>");
            });

    }
    }
});


app.get('/review/:id', function (req, res) {
    console.log('update  page accessed');
    var username = req.session.user;
    var password = req.session.pass;
    var user_role = req.session.user_role;
    if(!username || !password || !user_role){
        res.redirect('/');
        res.end();

    }
    if(user_role == 2){
        var objID = req.params.id;
        console.log(objID);
        productModel.findById(objID, function (err, response) {
            console.log(response);
            if(response){
                res.render('add_review', {products: response, id: response._id});
            }else{
                res.send("<script>alert('Product not found!'); window.location.replace('/home')</script>");
            }
        });
    }
});


app.post('/review', function (req, res) {
    console.log('review post  page accessed');
    var username = req.session.user;
    var password = req.session.pass;
    var user_role = req.session.user_role;
    if(!username || !password || !user_role){
        res.redirect('/');
        res.end();

    }

    if(user_role == 2){
        var data = req.body;
        var newReview = new reviwModel({p_id:data.product_id, user:username, review:data.review});
        newReview.save(function (err, result) {
            if(err) throw err;
            res.send("<script>alert('Review added!'); window.location.replace('/')</script>");
        })
    }
});


app.get('/roles/:id', function (req, res) {
    console.log('roles post  page accessed');
    var username = req.session.user;
    var password = req.session.pass;
    var user_role = req.session.user_role;
    if(!username || !password || !user_role){
        res.redirect('/');
        res.end();

    }

    if(user_role == 3){
        var objID = req.params.id;
        userModel.findById(objID, function (err, reposnse) {
            if(err) throw err;
            if(reposnse){
                if(reposnse.user_role == 1){
                    userModel.findByIdAndUpdate(objID, {user_role:2},function (err, response) {
                        res.send("<script>alert('Role switched to buyer now!'); window.location.replace('/home')</script>");
                    });
                }else if(reposnse.user_role == 2){
                    userModel.findByIdAndUpdate(objID, {user_role:1},function (err, response) {
                        res.send("<script>alert('Role switched to seller now!'); window.location.replace('/home')</script>");
                    });
                }
            }
        });
    }
});


app.get('/add-user', function (req, res) {
    console.log('add-user  page accessed');
    var username = req.session.user;
    var password = req.session.pass;
    var user_role = req.session.user_role;
    if(!username || !password || !user_role){
        res.redirect('/');
        res.end();

    }
    if(user_role == 3){
        res.render('add_user');

    }
});


app.post('/add-user', function (req, res) {
    console.log('add-user  page accessed');
    var username = req.session.user;
    var password = req.session.pass;
    var user_role = req.session.user_role;
    if(!username || !password || !user_role){
        res.redirect('/');
        res.end();

    }
    if(user_role == 3){
        var data = req.body;
        var newUser = new userModel({username:data.username, password:md5(data.pass), user_role:data.user_role});
        newUser.save(function (err, result) {
            if(err) throw err;
            res.send("<script>alert('User added!'); window.location.replace('/add-user')</script>");
        })

    }
});


app.get('/logout', function (req, res) {
    console.log('logout  page accessed');
    delete req.session.user;
    delete req.session.pass;
    delete req.session.user_role;
    res.redirect('/');

});

app.listen(1337, '127.0.0.1');