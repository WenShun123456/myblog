const express = require('express');
const User = require('../models/user');
const Article = require('../models/article');
const Category = require('../models/category');
const marked = require('marked');
const hljs = require('highlight.js');
let router = express.Router();

// marked配置
marked.setOptions({
  renderer: new marked.Renderer(),
  gfm: true,
  tables: true,
  breaks: true,
  pedantic: false,
  sanitize: true,
  smartLists: true,
  smartypants: false,
  highlight: function(code) {
    return hljs.highlightAuto(code).value;
  }
});

//定义一个数据变量
let data = {};

// 配置初始时信息的中间件
router.use((req, res, next) => {
  //清空数据变量
  data = {};
  //拿到用户信息
  Category.find().then(categorys => {
    data.categorys = categorys;
  })
  if (req.cookies.userInfo) {
    data.userInfo = req.cookies.userInfo;
    //分类信息查询
    User.findOne({
        _id: data.userInfo._id
      })
      .then((userInfo) => {
        if (userInfo && userInfo.avatar) {
          data.avatar = userInfo.avatar;
        }
        next()
      }).catch((err) => {
        console.log(err)
      })
  } else {
    next()
  }

});

// 用户访问首页或分类时

router.get('/', (req, res) => {
  //整合信息

  data.category = req.query.category || ''; //分类
  data.articles = []; //文章数组
  data.page = 1; //当前页
  data.maxPage = 1; //最大页
  data.url = '/';

  //查询条件
  let where = {};
  if (data.category) { //当用户传了分类时加入查询条件
    where.category = data.category;
  }

  //文章查询数量
  Article.where(where).count().then((count) => {
    let limit = 5; //每页显示数
    //接收传过来的page
    let query_page = Number(req.query.page) || 1;
    query_page = Math.min(Math.ceil(count / limit), query_page); //最大页为count/limit向上取整
    query_page = Math.max(query_page, 1); //最小值为1


    let cur_page = query_page; //当前页
    let skip = (cur_page - 1) * limit; //忽略的条数

    // 文章查询
    return Article.where(where).find().sort({
        addTime: -1
      }).limit(limit)
      .skip(skip).populate(['category', 'user']).then((articles) => {
        data.articles = articles;
        data.page = cur_page;
        data.maxPage = Math.ceil(count / limit);
      })
  }).then(() => {
    //渲染页面
    res.render('main/index', {
      title: '欢迎来到我的博客',
      data: data
    });
  }).catch((err) => {
    console.log(err)
  })

})
//加载更多文章
router.get('/getMoreArticles', (req, res) => {
  //整合信息

  data.category = req.query.category || ''; //分类
  data.articles = []; //文章数组
  data.page = 1; //当前页
  data.maxPage = 1; //最大页
  data.url = '/';

  //查询条件
  let where = {};
  if (data.category) { //当用户传了分类时加入查询条件
    where.category = data.category;
  }

  //文章查询数量
  Article.where(where).count().then((count) => {
    let limit = 5; //每页显示数
    //接收传过来的page
    let query_page = Number(req.query.page) || 1;
    if(Math.ceil(count / limit) < query_page) {
      data.maxPage = Math.ceil(count / limit)
      res.json(data);
    }
    query_page = Math.min(Math.ceil(count / limit), query_page); //最大页为count/limit向上取整
    query_page = Math.max(query_page, 1); //最小值为1


    let cur_page = query_page; //当前页
    let skip = (cur_page - 1) * limit; //忽略的条数

    // 文章查询
    return Article.where(where).find().sort({
        addTime: -1
      }).limit(limit)
      .skip(skip).populate(['category', 'user']).then((articles) => {
        data.articles = articles;
        data.page = cur_page;
        data.maxPage = Math.ceil(count / limit);
        res.json(data);
      })
  }).catch((err) => {
    console.log(err)
  })
})

//用户访问某一篇文章

router.get('/views', (req, res) => {
  //获取文章id
  let id = req.query.article_id || '';
  Article.findOne({
    _id: id
  }).populate(['category', 'user']).then((article) => {
    //如果文章不存在
    if (!article) {
      res.render('main/views', {
        title: '文章详情',
        data: data
      });
      return
    }

    // 阅读量加一
    article.views++;
    article.save();
    // 文章及分类
    data.article = article;
    data.category = article.category._id.toString();

    // 对文章内容进行语法转换
    data.article_content_html = marked(article.content);

    res.render('main/views', {
      title: '文章详情',
      data: data
    });
  })

})




module.exports = router