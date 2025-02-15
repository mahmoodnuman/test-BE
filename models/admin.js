const mongoose = require('mongoose');
const schema = mongoose.Schema;

// تعريف نموذج التقييم
const ratingSchema = new schema({
    userId: {
        type: schema.Types.ObjectId,
        required: true,
        ref: 'User'
    },
    rating: {
        type: Number,
        required: true,
        min: 1,  // لضمان أن التقييم ضمن النطاق من 1 إلى 5
        max: 5   // الحد الأقصى للتقييم
    }
}, { timestamps: true });

// تعريف نموذج التعليق
const commentSchema = new schema({
    comment: {
        type: String,
        required: true
    },
    userId: {
        type: schema.Types.ObjectId,
        required: true,
        ref: 'User'
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date
    },
    ratings: [ratingSchema], // Array to store ratings from users
    averageRating: { // إضافة حقل averageRating
        type: Number,
        default: 0
    }
}, { timestamps: true });

// إضافة hook لتحديث `updatedAt` عند تعديل التعليق
commentSchema.pre('save', function(next) {
    if (this.isModified('comment')) {
        this.updatedAt = Date.now();
    }
    next();
});

module.exports = mongoose.model('Comment', commentSchema);