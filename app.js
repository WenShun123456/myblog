const swig = require('swig'); //模板引擎
const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const User = require('./models/user');
const app = express();
 
// 设置cookie中间件
app.use(cookieParser())





// 设置body中间件
app.use(bodyParser.urlencoded({
  extended: true
}));

// 设置swig模板引擎
swig.setDefaults({
  cache: false
});
app.set('views', './views');
app.set('view cache', false);
app.set('view engine', 'html');
app.engine('html', swig.renderFile);

// 配置静态文件服务
app.use('/public', express.static(__dirname + '/public'));


//配置路由
app.use('/', require('./routers/index'));
app.use('/admin', require('./routers/admin'));
app.use('/api', require('./routers/api'));

//连接数据库

mongoose.connect('mongodb://localhost:27017/myblog', (err) => {
  if (err) {
    console.log('DB connecting error');
  } else {
    console.log('DB connecting success')

    // 设置端口号
    app.listen(80, (req, res, next) => {
      console.log('myblog is running at port 80');
    })

  }
})