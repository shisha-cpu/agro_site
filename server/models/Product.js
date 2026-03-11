const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  latin: { type: String, default: '' },
  condition: { type: String, default: '' },
  price: { type: Number, required: true },
  category: { type: String, required: true, index: true },
  emoji: { type: String, default: '🌿' },
  popular: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model('Product', productSchema);
