const express = require('express');
const User = require('../models/user');
const Category = require('../models/category');
const Article = require('../models/article');
const router = express.Router();

router.use((req, res, next) => {
  if (!req.cookies.userInfo.isAdmin) {
    res.send('<h2>只有管理员才能进入哦！</h2>');
    return
  }
  next();
})

// 访问后台首页
router.get('/', (req, res) => {
  res.render('admin/index', {
    userInfo: req.cookies.userInfo
  });
})

//用户管理
router.get('/user', (req, res) => {
  // 做分页处理
  let limit = 10;
  User.count().then((count) => {
    // 拿到传过来的page
    let query_page = Number(req.query.page) || 1;
    query_page = Math.min(Math.ceil(count / limit), query_page); //限制最大值 count/limit 向上取整
    query_page = Math.max(query_page, 1); //最小值为1

    let cur_page = query_page; //当前页
    let skip = (cur_page - 1) * limit; //忽略条数


    User.find().limit(limit).skip(skip).then((users) => {
      res.render('admin/user_index', {
        userInfo: req.cookies.userInfo,
        users: users,
        page: cur_page,
        maxPage: Math.ceil(count / limit),
        url: '/admin/user'
      });
    })
  })
})

// 删除用户及该用户的留言
router.get('/user/delete', (req, res) => {
  let id = req.query.id || '';
  // 删除该用户的所有评论
  Article.find().then(articles => {
    for (let i = 0; i < articles.length; i++) {
      let commentArr = articles[i].comments;
      for (let j = 0; j < commentArr.length; j++) {
        if (commentArr[j].userid && commentArr[j].userid === id) {
          // 删除指定评论
          commentArr.splice(commentArr.findIndex(item => {
            return item.userid === id;
          }), 1);
          // 保存
          articles[i].save();
        }
      }
    }
    // 删除指定用户
    return User.remove({
      _id: id
    });

  }).then(() => {
    res.render('admin/success', {
      userInfo: req.cookies.userInfo,
      message: '用户删除成功！',
      url: '/admin/user'
    });
  })
})

// 博文首页分类
router.get('/category', (req, res) => {
  Category.count().then((count) => {
    let limit = 10; //每条显示页数


    let query_page = Number(req.query.page) || 1;
    query_page = Math.min(Math.ceil(count / limit), query_page); //最大页数
    query_page = Math.max(query_page, 1); //最小页数

    let cur_page = query_page; //当前页
    let skip = (cur_page - 1) * limit //忽略的条数

    Category.find().sort({
      _id: -1
    }).limit(limit).skip(skip).then((categories) => {
      res.render('admin/category_index', {
        userInfo: req.cookies.userInfo,
        categories,
        page: cur_page,
        maxPage: Math.ceil(count / limit),
        url: '/admin/category'
      });
    })
  }).catch(e => {
    console.log(e);
  })
})

//添加博文分类页面
router.get('/category/add', (req, res) => {
  res.render('admin/category_add', {
    userInfo: req.cookies.userInfo
  })
})
//添加博文操作
router.post('/category/add', (req, res) => {
  let name = req.body.category_name || '';
  // 判断提交名称为空
  if (name === '') {
    res.render('admin/fail', {
      userInfo: req.cookies.userInfo,
      message: '分类名称不能为空！'
    });
    return
  }
  //提交内容是否存在
  Category.findOne({
    category_name: name
  }).then((result) => {
    if (result) {
      res.render('admin/fail', {
        userInfo: req.cookies.userInfo,
        message: '该分类已存在！'
      })
      return Promise.reject('分类已存在');
    } else {
      return new Category({
        category_name: name
      }).save()
    }
  }).then((newResult) => {
    // 添加成功
    res.render('admin/success', {
      userInfo: req.cookies.userInfo,
      message: '分类添加成功！',
      url: '/admin/category'
    })
  }).catch((e) => {
    console.log(e);
  })

})

//编辑分类页面
//实例一个编辑分类对象存储需要编辑的分类
let category_edit = {}

router.get('/category/edit', (req, res) => {
  let id = req.query.id;
  Category.findOne({
    _id: id
  }).then((category) => {
    if (category) {
      category_edit = category;
      res.render('admin/category_edit', {
        userInfo: req.cookies.userInfo,
        category: category.category_name,
        url: '/admin/category'
      });
    } else {
      // 出错
      res.render('admin/fail', {
        userInfo: req.cookies.userInfo,
        message: '编辑出错！',
        url: '/admin/category'
      });
    }
  })

})
//提交修改操作
router.post('/category/edit', (req, res) => {
  let name = req.body.category_name || '';
  // 判断提交名称为空
  if (name === '') {
    res.render('admin/fail', {
      userInfo: req.cookies.userInfo,
      message: '分类名称不能为空！',
      url: '/admin/categroy'
    });
    return
  }
  //若没有更改
  if (name === category_edit.category_name) {
    res.render('admin/success', {
      userInfo: req.cookies.userInfo,
      message: '分类修改成功',
      url: '/admin/category'
    });
    return
  }

  Category.findOne({
    category_name: name
  }).then((category) => {
    if (category) {
      // 该名称已存在
      res.render('admin/fail', {
        userInfo: req.cookies.userInfo,
        message: '该分类已存在！',
        url: '/admin/category'
      })
    } else {
      // 更新该分类
      Category.update({
        _id: category_edit._id
      }, {
        category_name: name
      }).then(() => {
        res.render('admin/success', {
          userInfo: req.cookies.userInfo,
          message: '分类修改成功！',
          url: '/admin/category'
        })
      })
    }
  })
})

// 分类删除操作
router.get('/category/delete', (req, res) => {
  let id = req.query.id || '';
  Category.remove({
    _id: id
  }).then(() => {
    res.render('admin/success', {
      userInfo: req.cookies.userInfo,
      message: '分类删除成功！',
      url: '/admin/category'
    });
  })
})

//文章管理首页
router.get('/article', (req, res) => {
  Article.count().then((count) => {
    let limit = 5; //每页显示条数


    // 拿到传过来的page
    let query_page = Number(req.query.page) || 1;
    query_page = Math.min(Math.ceil(count / limit), query_page) //最大值
    query_page = Math.max(query_page, 1); //最小值


    let cur_page = query_page;
    let skip = (cur_page - 1) * limit; //忽略条数

    Article.find().sort({
        _id: -1
      }).limit(limit)
      .skip(skip).populate(['category', 'user']).then((articles) => {
        res.render('admin/article_index', {
          userInfo: req.cookies.userInfo,
          articles,
          page: cur_page,
          maxPage: Math.ceil(count / limit),
          url: '/admin/article'
        })
      }).catch(e => {
        console.log(e);
      })
  })
})

//文章添加页面
router.get('/article/add', (req, res) => {
  //查找分类
  Category.find().sort({
    _id: -1
  }).then((categorys) => {
    res.render('admin/article_add', {
      userInfo: req.cookies.userInfo,
      categorys: categorys
    })
  })
})

//处理添加文章操作
router.post('/article/add', (req, res) => {


  // 定义返回数据对象
  let responseData = {
    code: 0,
    message: ''
  }

  let title = req.body.title || '';
  let category = req.body.category || '';
  let description = req.body.description || '';
  let content = req.body.content || '';

  if (title === '' || description === '' || content === '') {
    responseData.code = 22;
    responseData.message = '标题、简介或者内容不能为空！';
    res.json(responseData);
    return
  }

  //标题不能重复
  Article.findOne({
    title: title
  }).then((article) => {
    if (article) { //存在相同标题
      responseData.code = 33;
      responseData.message = '改文章标题已存在！';
      res.json(responseData);
      return
    } else {
      return new Article({
        title,
        user: req.cookies.userInfo._id.toString(),
        addTime: new Date(),
        category,
        description,
        content: new Buffer(content, 'base64').toString()
      }).save()
    }
  }).then(() => {
    //添加成功
    responseData.message = '文章添加成功！';
    res.json(responseData);
  }).catch(e => {
    console.log(e)
  })
})

//文章修改页面渲染
router.get('/article/edit', (req, res) => {
  let id = req.query.id;
  Article.findOne({
    _id: id
  }).populate('category').then(article => { //关联分类
    if (!article) {
      res.render('admin/fail', {
        userInfo: req.cookies.userInfo,
        message: '想要修改的文章不存在！'
      })
    } else {
      // 打开修改页面
      Category.find().then((categorys) => {
        if (categorys) {
          res.render('admin/article_edit', {
            userInfo: req.cookies.userInfo,
            categorys,
            article,
            url: '/admin.article'
          });
        } else {
          res.render('admin/fail', {
            userInfo: req.cookies.userInfo,
            message: '您还未添加分类!'
          });
        }
      })
    }
  })
})
//文章提交修改
router.post('/article/edit', (req, res) => {


  //返回的数据对象
  let responseData = {
    code: 0,
    message: ''
  }

  let id = req.body.id;

  let {title, category, description, content} = req.body;

  // 判断非空
  if(title === '' || description === '' || content === '') {
    responseData.code = 66;
    responseData.message = '标题、简介或者内容不能为空！';
    res.json(responseData);
    return 
  }

  Article.findOne({
    _id: id
  }).then((article) => {
    if(!article) {
      responseData.code = 77;
      responseData.message = '修改出错！';
      res.json(responseData);
      return Promise.reject('修改出错');
    } else {
      return Article.updateOne({
        _id: id
      }, {
        title,
        category,
        description,
        content: new Buffer(content, 'base64').toString()
      });
    }
  }).then(() => {
    // 修改成功
    responseData.message = '文章内容修改成功！';
    res.json(responseData);
  })
})

//删除文章
router.get('/article/delete', (req, res) => {
  let id = req.query.id;

  Article.remove({
    _id: id
  }).then(() => {
    res.render('admin/success', {
      userInfo: req.cookies.userInfo,
      message: '文章删除成功',
      url: '/admin/article'
    })
  })
})

module.exports = router