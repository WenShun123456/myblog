var limit = 6; //初始条数
var cur_page = 1; //当前页数
var hashComments = []; //加载的评论
var hasMoreComments = true; //是否有更多评论的标志位

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

$(document).ready(function() {
  //隐藏页脚
  $('footer').hide();
  // 全局ajax请求显示loading
  $(window).ajaxStart(function() {
    $('.loading').show()
  })
  $(window).ajaxSuccess(function() {
    $('.loading').hide()
  })
  //拉取第一页评论
  $.ajax({
    type: 'get',
    url: '/api/comment',
    data: {
      article_id: $('#article_id').val(),
      limit: limit,
      cur_page: cur_page
    },
    success: function(response) {
      // 渲染评论列表
      if (response.comments.length < limit) {
        hasMoreComments = false;
      }
      renderCommentList(response.comments);
    }
  });

  function renderCommentList(comments) {
    var html = ''
    comments.forEach(comment => {
      html += `
        <div class="comment-item">
            <div class="comment-info">
                <span class='info'>
                  <img class='avatar' src="${comment.avatar}" alt="">
                  <span class='username'>${comment.username}</span>
                </span>
                <span>${formatTime(comment.time)}</span>
            </div>   
            <div class="comment-txt">${comment.comment_txt}</div>
        </div>
      `
    })

    $('.comments-list').append(html);
    if (!hasMoreComments) {
      $('footer').show();
    }
  }

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
      if (hasMoreComments) {
        debounce(getMoreComments, 100)()
      }
    }
  })
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
  //加载更多评论
  function getMoreComments() {
    cur_page++;
    $.ajax({
      type: 'get',
      url: '/api/comment',
      data: {
        article_id: $('#article_id').val(),
        limit: limit,
        cur_page: cur_page
      },
      success: function(response) {
        if (response.maxPage < cur_page) {
          hasMoreComments = false;
        }
        cur_page++;
        renderCommentList(response.comments);
      }
    })
  }
  //提交评论
  $('.comment-push').click(function() {
    $.ajax({
      type: 'POST',
      url: '/api/comment/post',
      data: {
        comment_txt: $('#comment-txt').val(),
        article_id: $('#article_id').val()
      },
      success: function(response) {
        if (response.code === 0) {
          showDialog(response.message, 1, function() {
            window.location.reload();
          })
        } else {
          showDialog('评论失败', 2, function() {
            window.location.reload();
          })
        }
      }
    })
  })

})

function showDialog(text, icon, callback) {
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
  });
}