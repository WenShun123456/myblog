$(document).ready(function() {

  var base64 = new Base64();

  // 设置预览样式
  $('#bjw-previous').css({
    "height": "815px",
    "padding": "10px",
    "overflow": "auto",
    "border-radius": "5px",
    "border": "2px solid gainsboro"
  });

  // marked的相关配置
  marked.setOptions({
    renderer: new marked.Renderer(),
    gfm: true,
    tables: true,
    breaks: true,
    pedantic: false,
    sanitize: false,
    smartLists: true,
    smartypants: false,
    highlight: function(code) {
      return hljs.highlightAuto(code).value;
    }
  });

  //MarkDown语法解析预览
  $('#bjw-content').on('keyup blur', function() {
    $('#bjw-previous').html(marked($('#bjw-content').val()));
  })

  // 是文本域支持缩进
  $('#bjw-content').on('keydown', function(e) {
    if (e.keyCode === 9) {
      var position = this.selectionStart + 2;
      this.value = this.value.substr(0, this.selectionStart) + '  ' + this.value.substr(this.selectionStart);
      this.selectionStart = position;
      this.selectionEnd = position;
      this.focus();
      e.preventDefault();
    }
  })

  // 用Ctrl + A实现内容全选
  $('#bjw-content').on('keydown', function(e) {
    if (e.ctrlKey && e.keyCode === 65) {
      this.selectionStart = 0;
      this.selectionEnd = this.value.length;
    }
  });
  //管理员对文章的添加
  var formArticleAdd = $('#form-article-add');
  $('#article-add').click(function() {
    $.ajax({
      type: 'POST',
      url: '/admin/article/add',
      data: {
        title: formArticleAdd.find('[name="title"]').val(),
        category: formArticleAdd.find('[name="category"]').val(),
        description: formArticleAdd.find('[name="description"]').val(),
        content: base64.encode(formArticleAdd.find('[name="content"]').val())
      },
      success: function(response) {
        if (!response.code) {
          showDialog(response.message, 1, function() { //成功
            window.location.href = '/admin/article';
          })
        } else {
          showDialog(response.message, 2);
        }
      }
    })
  })

  //文章修改或者编辑
  var formArticleEdit = $('#form-article-edit');
  $('#article-edit').click(function() {
    $.ajax({
      type: 'POST',
      url: '/admin/article/edit',
      data: {
        id: formArticleEdit.find('[name="id"]').val(),
        title: formArticleEdit.find('[name="title"]').val(),
        category: formArticleEdit.find('[name="category"]').val(),
        description: formArticleEdit.find('[name="description"]').val(),
        content: base64.encode(formArticleEdit.find('[name="content"]').val())
      },
      success: function(response) {
        if (!response.code) {
          showDialog(response.message, 1, function() { //成功
            window.location.href = '/admin/article';
          })
        } else {
          showDialog(response.message, 2);
        }
      }
    })
  })
})

// 当登录错误显示弹框
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