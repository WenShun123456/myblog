const mongoose = require('mongoose');
const articleSchema = require('../schemas/articleSch');

module.exports = mongoose.model('Article', articleSchema);