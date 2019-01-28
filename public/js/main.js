$(document).ready(function() {
  var index_login;
  var index_register;
  var hasMoreArticles = true; //是否有更多文章的标志位
  var cur_page = 2;
  var articles = [];
  $('footer').hide();
  $('.loading').hide();
  //下拉加载更多文章
  // 全局ajax请求显示loading
  $(window).ajaxStart(function () {
    $('.loading').show()
  })
  $(window).ajaxSuccess(function () {
    $('.loading').hide()
  })
  //获取滚动条当前的位置， 就是距离页面顶部的距离
  function getScrollTop() {
    var scrollTop = 0;
    if (document.documentElement && document.documentElement.scrollTop) {
      scrollTop = document.documentElement.scrollTop;
    } else if (document.body) {
      scrollTop = document.body.scrollTop;
    }
    return scrollTop
  }
  //获取当前可视范围的高度 
  function getClientHeight() {
    var clientHeight = 0;
    if (document.body.clientHeight && document.documentElement.clientHeight) {
      clientHeight = Math.min(document.body.clientHeight, document.documentElement.clientHeight);
    } else {
      clientHeight = Math.max(document.body.clientHeight, document.documentElement.clientHeight);
    }
    return clientHeight;
  }

  //获取文档完整的高度 
  function getScrollHeight() {
    return Math.max(document.body.scrollHeight, document.documentElement.scrollHeight);
  }

  //滚动事件触发
  $(window).scroll(function() {
    if (getScrollTop() + getClientHeight() >= getScrollHeight()) {
      if (hasMoreArticles) {
        debounce(getMoreArticles, 100)()
      }
    }
  })
  //ajax拉取文章
  function getMoreArticles() {
    $.ajax({
      type: 'get',
      url: '/getMoreArticles',
      data: {
        page: cur_page
      },
      success: function(res) {
        if (Number(res.maxPage) <= cur_page) {
          hasMoreArticles = false;
          $('footer').show();
        }
        if (res.articles.length > 0) {
          addArticlesDom(res.articles);
        }
        cur_page++;
      }
    })
  }

  //将文章dom渲染在最后
  function addArticlesDom(articles) {
    var html = '';

    articles.forEach((article) => {
      html += `
      <div class="article-item">
        <h2 class="title">${ article.title }</h2>
        <div class="info">
        作者:<span class="info-item author">${ article.user.username }</span>
        时间:<span class="info-item time">${ formatTime(article.addTime) }</span>
        阅读量:<span class="info-item views">${ article.views }</span>
        评论:<span class="info-item comment">${ article.comments.length }</span>
        </div>
        <p class="description">${ article.description }</p>
        <div class="btn-read-wrapper">
          <a href="/views?article_id=${ article._id.toString() }" class="btn-read-all">全文阅读</a>  
        </div>
      </div>
      `
    })

    $('.article-item-wrapper').append(html);
  }
  //防抖函数
  function debounce(fun, delay) {
    let timer
    return function(...arg) {
      if (timer) {
        clearTimeout(timer);
      }
      timer = setTimeout(() => {
        fun.apply(this, arg)
      }, delay)
    }
  }
  //格式化时间
  function formatTime(time) {
    var date = new Date(time);
    var y = String(date.getFullYear()).substring(2);
    var m = date.getMonth() + 1;
    m = m > 9 ? m : ('0' + m);
    var d = date.getDate();
    d = d > 9 ? d : ('0' + d);
    return y + '/' + m + '/' + d;
  }
  // 登录
  $(".login").click(function() {
    index_login = layer.open({
      type: 1,
      title: "登录",
      closeBtn: 1,
      shadeClose: true,
      skin: 'layin-layer-molv',
      area: ['320px', '300px'],
      content: $('.login-dialog')
    });
  })
  // 注册
  $('.register').click(function() {
    index_register = layer.open({
      type: 1,
      title: '注册',
      closeBtn: 1,
      shadeClose: true,
      skin: 'layui-layer-molv',
      area: ['320px', '350px'],
      content: $('.register-dialog')
    })
  });

  // 点击眼睛查看密码
  $('.dialog .eye').click(function() {
    var node_input = $(this).siblings('input');
    if (node_input.attr('type') === 'password') {
      node_input.attr('type', 'text');
      $(this).removeClass('eye_show').addClass('eye_hidden');
    } else {
      node_input.attr('type', 'password');
      $(this).removeClass('eye_hidden').addClass('eye_show');
    }
  })

  var $registerBox = $('.register-dialog');
  var $loginBox = $('.login-dialog');

  // 提交注册表单
  $registerBox.find('.submit').click(function() {
    $.ajax({
        type: 'POST',
        url: '/api/register',
        dataType: 'json',
        data: {
          username: $registerBox.find('[name="username"]').val(),
          password: $registerBox.find('[name="password"]').val(),
          repeat: $registerBox.find('[name="repeat"]').val()
        },
        success: function(result) {
          if (result.code) {
            dialog_err(result.message, 2); //注册错误
          } else {
            dialog_err(result.message, 1, function() {
              // 关闭注册框
              layer.close(index_register);
              // 重载页面
              window.location.reload();
            })
          }
        }
      }

    )

  })

  // 提交登录
  $loginBox.find('.submit').click(function() {
    $.ajax({
      type: 'POST',
      url: '/api/login',
      dataType: 'json',
      data: {
        username: $loginBox.find('[name="username"]').val(),
        password: $loginBox.find('[name="password"]').val()
      },
      success: function(result) {
        if (result.code) {
          // 登录错误处理
          dialog_err(result.message, 2);
        } else {
          // 登录成功
          dialog_err(result.message, 1, function() {
            layer.close(index_login);
            window.location.reload()
          })
        }
      }
    })
  })

  // 点击提出登录
  $('.userInfo .logout').click(function() {
    $.ajax({
      type: 'POST',
      url: '/api/logout',
      success: function(result) {
        dialog_err(result.message, 1, function() {
          window.location.reload()
        })
      }
    })
  })

  function dialog_err(text, icon, callback) {
    layer.open({
      time: 1500,
      anim: 4,
      offset: 't',
      icon: icon,
      content: text,
      btn: false,
      title: false,
      closeBtn: 0,
      end: function() {
        callback && callback();
      }
    })
  }
  //手机端点击头像显示左侧栏
  $('.head').click(function () {
    $('.friend-link').animate({'left':0},() => {
      $('.left-wrapper').show();
    });
    
  })
  //点击遮罩层消失
  $('.left-wrapper').click(function () {
    $('.friend-link').animate({'left':'-100%'},() => {
      $('.left-wrapper').hide();   
    });
  })

})