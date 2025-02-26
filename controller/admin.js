const { validationResult } = require('express-validator');
const commentSchema = require('../models/admin');
const userSchema = require('../models/users');
const path = require('path');
const fs = require('fs');

// الحصول على جميع التعليقات مع ترقيم الصفحات
exports.getComments = async (req, res, next) => {
    try {
        const currentPage = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 5; // يمكنك تركها فقط للصفحات ولكن ليست ضرورية الآن لجميع التعليقات.
        const totalItems = await commentSchema.countDocuments();
        const comments = await commentSchema.find()
            .skip((currentPage - 1) * limit)
            .limit(totalItems) // استرجاع جميع التعليقات
            .sort({ createdAt: -1 })
            .populate('userId', 'username profilePicture');

        // إضافة متوسط التقييم لكل تعليق
        const commentsWithRatings = comments.map(comment => {
            let totalRating = 0;
            let averageRating = 0;

            if (comment.ratings.length > 0) {
                // حساب مجموع التقييمات
                totalRating = comment.ratings.reduce((sum, rating) => sum + rating.rating, 0);
                // حساب المتوسط
                averageRating = totalRating / comment.ratings.length;
            }

            // إضافة حقل averageRating إلى التعليق
            return {
                ...comment.toObject(), // تحويل Mongoose document إلى object عادي
                averageRating: averageRating.toFixed(2) // تقريب المتوسط إلى منزلتين عشريتين
            };
        });

        res.status(200).json({
            comments: commentsWithRatings,
            totalItems: totalItems
        });
    } catch (err) {
        next(err);
    }
};

// إضافة تعليق جديد
exports.createComment = async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            message: "Validation failed",
            errors: errors.array()
        });
    }

    try {
        const user = await userSchema.findById(req.userData.userId).select("username email profilePicture");
        
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        const newComment = new commentSchema({
            comment: req.body.comment,
            userId: req.userData.userId,
            username: user.username,
            createdAt: Date.now(),
        });
        console.log(user);

        await newComment.save();

        // استخدم populate لاسترجاع بيانات المستخدم بالتفصيل
        await newComment.populate('userId', 'username profilePicture');

        res.status(201).json({
            message: "Comment Created Successfully",
            comment: newComment
        });
    } catch (err) {
        next(err);
    }
};



// إضافة تقييم للتعليق
exports.addRating = async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            message: "Validation failed",
            errors: errors.array()
        });
    }

    try {
        const { commentId } = req.params;
        const { rating } = req.body;

        const comment = await commentSchema.findById(commentId);
        if (!comment) {
            const error = new Error("No Comment Found With This ID...");
            error.statusCode = 404;
            throw error;
        }

        const existingRating = comment.ratings.find(r => r.userId.toString() === req.userData.userId.toString());
        if (existingRating) {
            existingRating.rating = rating;
        } else {
            comment.ratings.push({ userId: req.userData.userId, rating: rating || 0 });
        }

        // حساب متوسط التقييم
        let totalRating = 0;
        if (comment.ratings.length > 0) {
            totalRating = comment.ratings.reduce((sum, rating) => sum + rating.rating, 0);
            comment.averageRating = totalRating / comment.ratings.length;
        }

        const result = await comment.save();
        res.status(201).json({
            message: "Rating Added or Updated Successfully",
            comment: result
        });
    } catch (err) {
        next(err);
    }
};

exports.editComment = async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            message: "Validation failed",
            errors: errors.array()
        });
    }

    try {
        const commentId = req.params.id;
        const updatedComment = req.body.comment;

        // جلب بيانات المستخدم الذي يقوم بالتعديل
        const user = await userSchema.findById(req.userData.userId).select("username profilePicture");
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // إضافة النص "Edited by Admin" إلى التعليق
        const adminMessage = ` (Edited by Admin: ${user.username})`;

        // تحديث التعليق وإضافة الرسالة
        const result = await commentSchema.findByIdAndUpdate(
            commentId,  // معرّف التعليق الذي سيتم تحديثه
            { 
                comment: updatedComment + adminMessage,  // إضافة الرسالة إلى التعليق
                username: user.username  // تحديث اسم المستخدم
            },
            { new: true }  // لضمان إرجاع النسخة الجديدة من التعليق
        ).populate('userId', 'username profilePicture');  // لجلب بيانات المستخدم المرتبط بالتعليق

        if (!result) {
            const error = new Error("No Comment Found With This ID...");
            error.statusCode = 404;
            throw error;
        }

        res.status(200).json({
            message: "Comment Updated Successfully",
            comment: result
        });
    } catch (err) {
        next(err);
    }
};



// حذف تعليق
exports.deleteComment = async (req, res, next) => {
    try {
        const commentId = req.params.id;
        const result = await commentSchema.findByIdAndRemove(commentId);
        if (!result) {
            const error = new Error("No Comment Found With This ID...");
            error.statusCode = 404;
            throw error;
        }

        res.status(200).json({ message: "Comment Deleted Successfully" });
    } catch (err) {
        next(err);
    }
};

exports.getUserComments = async (req, res, next) => {
    try {
        const currentPage = parseInt(req.query.page) || 1; // الصفحة الحالية (افتراضيًا 1)
        const limit = parseInt(req.query.limit); // عدد العناصر في الصفحة (افتراضيًا 5)

        // إذا تم إرسال معاملة "user" عبر الـ query، يتم استخدامها للفلترة،
        // وإلا يتم استخدام userId الخاص بالمستخدم من الـ token
        const filterUserId = req.query.user ? req.query.user : req.userData.userId;

        // حساب عدد التعليقات للفلتر المحدد
        const totalComments = await commentSchema.find({ userId: filterUserId }).countDocuments();
        const totalPages = Math.ceil(totalComments / limit); // عدد الصفحات

        if (totalComments === 0) {
            const error = new Error("No Comments Found For This User...");
            error.statusCode = 404;
            throw error;
        }

        // استرجاع التعليقات مع التقييمات للفلتر المحدد
        const comments = await commentSchema.find({ userId: filterUserId })
            .skip((currentPage - 1) * limit) // تخطي التعليقات السابقة
            .limit(limit) // تحديد عدد التعليقات في الصفحة
            .sort({ createdAt: -1 }) // ترتيب التعليقات من الأحدث إلى الأقدم
            .populate('userId', 'username profilePicture'); // استرجاع بيانات المستخدم (إن كان ضروريًا)

        // إضافة متوسط التقييم لكل تعليق
        const commentsWithRatings = comments.map(comment => {
            let totalRating = 0;
            let averageRating = 0;

            if (comment.ratings && comment.ratings.length > 0) {
                // حساب مجموع التقييمات
                totalRating = comment.ratings.reduce((sum, rating) => sum + rating.rating, 0);
                // حساب المتوسط
                averageRating = totalRating / comment.ratings.length;
            }

            // إضافة حقل averageRating إلى التعليق
            return {
                ...comment.toObject(), // تحويل Mongoose document إلى object عادي
                averageRating: averageRating.toFixed(2) // تقريب المتوسط إلى منزلتين عشريتين
            };
        });

        // إرجاع الـ Response
        res.status(200).json({
            comments: commentsWithRatings,
            totalComments: totalComments,
            totalPages: totalPages,
            currentPage: currentPage
        });
    } catch (err) {
        next(err); // تمرير الخطأ إلى المعالج التالي
    }
};
