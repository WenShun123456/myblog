const mongoose = require('mongoose');


module.exports = new mongoose.Schema({
  //关联字段
  category: {
    type: mongoose.Schema.Types.ObjectId,
    //引用
    ref: 'Category'
  },

  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },

  //添加时间

  addTime: {
    type: Date,
    default: new Date()
  },
  // 阅读量
  views: {
    type: Number,
    default: 0
  },

  title: String,

  description: {
    type: String,
    default: ''
  },

  content: {
    type: String,
    default: ''
  },
  // 评论
  comments: {
    type: Array,
    default: []
  }


})