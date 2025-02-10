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
    ratings: [ratingSchema] // Array to store ratings from users
}, { timestamps: true });

// إضافة hook لتحديث `updatedAt` عند تعديل التعليق
commentSchema.pre('save', function(next) {
    if (this.isModified('comment')) {
        this.updatedAt = Date.now();
    }
    next();
});

// إضافة تحقق من التقييمات للتأكد من أن كل مستخدم يمكنه تقييم التعليق مرة واحدة فقط
commentSchema.pre('save', function(next) {
    if (this.isModified('ratings')) {
        const userIds = this.ratings.map(rating => rating.userId.toString());
        if (new Set(userIds).size !== userIds.length) {
            return next(new Error('Each user can rate only once per comment'));
        }
    }
    next();
});

module.exports = mongoose.model('Comment', commentSchema);
