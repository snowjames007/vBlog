var Db = require('./db');
var poolModule = require('generic-pool');
var pool = poolModule.Pool({
    name     : 'mongoPool',
    create   : function(callback) {
        var mongodb = Db();
        mongodb.open(function (err, db) {
            callback(err, db);
        })
    },
    destroy  : function(mongodb) {
        mongodb.close();
    },
    max      : 100,
    min      : 5,
    idleTimeoutMillis : 30000,
    log      : true
});

function User(user) {
    this.name = user.name;
    this.password = user.password;
    this.email = user.email;
};

module.exports = User;

//存储用户信息
User.prototype.save = function(callback) {
    //要存入数据库的用户文档
    var user = {
        name: this.name,
        password: this.password,
        email: this.email
    };
    //打开数据库
    pool.acquire(function (err, db) {
        if (err) {
            return callback(err);//错误，返回 err 信息
        }
        //读取 users 集合
        db.collection('users', function (err, collection) {
            if (err) {
                pool.release(db);
                return callback(err);//错误，返回 err 信息
            }
            //将用户数据插入 users 集合
            collection.insert(user, {
                safe: true
            }, function (err, user) {
                pool.release(db);
                if (err) {
                    return callback(err);//错误，返回 err 信息
                }
                //console.log("user---->"+JSON.stringify(user));
                callback(null, user.ops);//成功！err 为 null，并返回存储后的用户文档//bug
            });
        });
    });
};

//读取用户信息
User.get = function(name, callback) {
    //打开数据库
    pool.acquire(function (err, db) {
        if (err) {
            return callback(err);//错误，返回 err 信息
        }
        //读取 users 集合
        db.collection('users', function (err, collection) {
            if (err) {
                pool.release(db);
                return callback(err);//错误，返回 err 信息
            }
            //查找用户名（name键）值为 name 一个文档
            collection.findOne({
                name: name
            }, function (err, user) {
                pool.release(db);
                if (err) {
                    return callback(err);//失败！返回 err 信息
                }
                callback(null, user);//成功！返回查询的用户信息
            });
        });
    });
};