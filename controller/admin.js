const { validationResult } = require('express-validator');
const commentSchema = require('../models/admin');
const userSchema = require('../models/users');
const path = require('path');
const fs = require('fs');

// الحصول على جميع التعليقات مع ترقيم الصفحات
exports.getComments = async (req, res, next) => {
    try {
        const currentPage = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const totalItems = await commentSchema.countDocuments();
        const result = await commentSchema.find()
            .skip((currentPage - 1) * limit)
            .limit(limit)
            .sort({ createdAt: -1 });

        res.status(200).json({
            comments: result,
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
        const newComment = new commentSchema({
            comment: req.body.comment,
            userId: req.userData.userId, // يتم تعيين userId من المستخدم المسجل
            createdAt: Date.now(),
        });

        await newComment.save();
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

    const { commentId } = req.params;
    const { rating } = req.body;

    try {
        const comment = await commentSchema.findById(commentId);
        if (!comment) {
            const error = new Error("No Comment Found With This ID...");
            error.statusCode = 404;
            throw error;
        }

        // إضافة التقييم دون التحقق من التقييمات السابقة
        comment.ratings.push({ userId: req.userData.userId, rating });
        const result = await comment.save();
        
        res.status(201).json({
            message: "Rating Added Successfully",
            comment: result
        });
    } catch (err) {
        next(err);
    }
};

// تعديل تعليق (مفتوح للمسؤولين فقط)
exports.editComment = async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            message: "Validation failed",
            errors: errors.array()
        });
    }

    const commentId = req.params.id;
    const updatedComment = req.body.comment;

    try {
        const result = await commentSchema.findByIdAndUpdate(commentId, { comment: updatedComment }, { new: true });
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

// حذف تعليق (مفتوح للمسؤولين فقط)
exports.deleteComment = async (req, res, next) => {
    const commentId = req.params.id;

    try {
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

// الحصول على تعليقات مستخدم معين
exports.getUserComments = async (req, res, next) => {
    const currentPage = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    try {
        const count = await commentSchema.find({ userId: req.userData.userId }).countDocuments();
        if (!count) {
            const error = new Error("No Comments Found For This User...");
            error.statusCode = 404;
            throw error;
        }
        const result = await commentSchema.find({ userId: req.userData.userId })
            .skip((currentPage - 1) * limit)
            .limit(limit)
            .sort({ createdAt: -1 });

        res.status(200).json({ comments: result });
    } catch (err) {
        next(err);
    }
};
