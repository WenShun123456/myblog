const mongoose = require('mongoose');
const categorySchema = require('../schemas/categorySch');

module.exports = mongoose.model('Category', categorySchema);