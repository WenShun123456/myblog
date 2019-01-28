const express = require('express');
const crypto = require('crypto');
const identicon = require('identicon.js');
const router = express.Router();
const User = require('../models/user');
const Article = require('../models/article');

//定义一个数据负责传输数据
var responseData;
router.use(function(req, res, next) {
  responseData = {
    code: 0,
    message: ''
  };
  next()
})

// 用户注册
router.post('/register', (req, res) => {
  let username = req.body.username;
  let password = req.body.password;
  let repeat = req.body.repeat;

  // 若用户名为空
  if (!username) {
    responseData.code = 1;
    responseData.message = '用户名为空';
    res.json(responseData);
    return;
  }

  // 密码为空
  if (!password) {
    responseData.code = 2;
    responseData.message = '密码为空';
    res.json(responseData);
    return
  }

  //密码不一致

  if (password !== repeat) {
    responseData.code = 3;
    responseData.message = '两次输入的密码不一致';
    res.json(responseData);
    return;
  }

  // 查询用户名是否已被注册
  User.findOne({
    username: username
  }).then((userInfo) => {
    if (userInfo) {
      responseData.code = 4;
      responseData.message = '该用户名已被注册';
      res.json(responseData);
      return Promise.reject('已被注册');
    }

    // 根据用户名随机生成头像
    let hash = crypto.createHash('md5');
    hash.update(username);
    let imgData = new identicon(hash.digest('hex')).toString();
    let imgUrl = 'data:image/png;base64,' + imgData;

    // 将该用户加入数据库
    const user = new User({
      username: username,
      password: password,
      avatar: imgUrl
    });

    return user.save()
  }).then((newUserInfo) => {
    responseData.message = '注册成功';
    responseData.userInfo = {
      _id: newUserInfo._id,
      username: newUserInfo.username,
      isAdmin: newUserInfo.isAdmin
    };
    // 设置cookie
    res.cookie('userInfo', responseData.userInfo);
    res.json(responseData);
  }).catch((err) => {
    console.log(err);
  })
})

// 用户登录
router.post('/login', (req, res, next) => {
  let username = req.body.username;
  let password = req.body.password;
  if (!username) {
    responseData.code = 1;
    responseData.message = '用户名为空';
    res.json(responseData);
    return;
  }

  if (!password) {
    responseData.code = 2;
    responseData.message = '密码为空';
    res.json(responseData);
    return;
  }

  // 查询数据库
  User.findOne({
    username: username
  }).then((user) => {
    if (user) {
      if (user.password === password) { //密码正确
        responseData.message = '登录成功';
        responseData.userInfo = {
          _id: user._id,
          username: user.username,
          isAdmin: user.isAdmin
        }
        res.cookie('userInfo', responseData.userInfo);
        res.json(responseData);
      } else {
        responseData.code = 6;
        responseData.message = '密码错误';
        res.json(responseData);
      }
    } else {
      responseData.code = 5;
      responseData.message = '该用户名不存在';
      res.json(responseData);
    }
  })
})
// 退出登录
router.post('/logout', (req, res) => {
  res.cookie('userInfo', null);
  responseData.message = '退出登录成功';

  res.json(responseData);
})

router.post('/comment/post', (req, res) => {
  let userid = req.cookies.userInfo._id;
  let username = req.cookies.userInfo.username;
  let article_id = req.body.article_id;
  let comment_txt = req.body.comment_txt || '';
  let time = new Date();

  if (comment_txt === '') {
    responseData.code = 8;
    responseData.message = '评论不能为空';
    res.json(responseData);
    return
  }
  //封装一个评论对象
  responseData.data = {
    userid,
    username,
    comment_txt,
    time
  }

  //将评论写入数据库
  Article.findOne({
    _id: article_id
  }).then(article => {
    article.comments.unshift(responseData.data);
    return article.save();
  }).then(() => {
    responseData.code = 0;
    responseData.message = '评论成功！'
    res.json(responseData);
  })

});


//获取评论列表
router.get('/comment', (req, res) => {
  let article_id = req.query.article_id;
  let limit = Number(req.query.limit);
  let cur_page = Number(req.query.cur_page);
  let maxPage = 1;
  // 查询文章评论
  Article.findOne({
    _id: article_id
  }).then(article => {
    maxPage = Math.ceil(article.length / limit);
    responseData.maxPage = maxPage;
    let comments = getComments(article.comments, limit, cur_page);
    addUserHead(comments, (comments) => {
      responseData.comments = comments;
      res.json(responseData);
    })
  })
  function getComments(comments, limit, cur_page) {
    return comments.slice((cur_page - 1) * limit, limit * cur_page)
  }
})
// 查询评论头像
function addUserHead(commentArr, callback) {
  User.find().then(users => {
    for (let i = 0; i < users.length; i++) {
      for (let j = 0; j < commentArr.length; j++) {
        if (commentArr[j].userid) { // 评论id存在
          if (commentArr[j].userid === users[i]._id.toString()) { // 找到了评论对应的用户
            if (users[i].avatar) { // 用户头像存在
              commentArr[j].avatar = users[i].avatar;
            }
          }
        }
      }
    }
    // 执行回调
    callback && callback(commentArr);

  });
}


module.exports = router