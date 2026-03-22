import { Schema, model } from 'mongoose';

const productSchema = new Schema(
  {
    sku: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
    },
    name: {
      type: String,
      required: true,
      index: true,
    },
    description: {
      type: String,
      default: '',
    },
    category: {
      type: String,
      required: true,
      index: true,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    discountPercentage: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    finalPrice: {
      type: Number,
      required: true,
      min: 0,
    },
    stockQuantity: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    images: {
      type: [String],
      default: [],
    },
    attributes: {
      type: Schema.Types.Mixed,
      default: {},
    },
    ratings: {
      average: { type: Number, default: 0, min: 0, max: 5 },
      count: { type: Number, default: 0, min: 0 },
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Pre-save hook to calculate final price
productSchema.pre('save', function (next) {
  if (this.isModified('price') || this.isModified('discountPercentage')) {
    const discount = (this.price * (this.discountPercentage || 0)) / 100;
    this.finalPrice = this.price - discount;
  }
  next();
});

export const Product = model('Product', productSchema);
