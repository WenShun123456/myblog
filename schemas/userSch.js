const mongoose = require('mongoose');

module.exports = new mongoose.Schema({
  username: String,
  password: String,
  avatar: String,
  isAdmin: {
    type: Boolean,
    default: false
  } 
});
