const { validationResult } = require('express-validator');
const commentSchema = require('../models/admin');
const userSchema = require('../models/users');
const path = require('path');
const fs = require('fs');


// الحصول على جميع التعليقات مع ترقيم الصفحات
exports.getComments = (req, res, next) => {
    const currentPage = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    let totalItems;
  
    commentSchema.countDocuments().then(count => {
      totalItems = count;
      return commentSchema.find()
        .skip((currentPage - 1) * limit)
        .limit(limit)
        .sort({ createdAt: -1 });
    }).then(result => {
      res.status(200).json({
        comments: result,
        totalItems: totalItems
      });
    }).catch(err => {
      next(err);
    });
  };
  
  // إضافة تعليق جديد
  exports.createComment = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: "Validation failed",
        errors: errors.array()
      });
    }
  
    const newComment = new commentSchema({
      comment: req.body.comment,
      userId: req.userData.userId, // يتم تعيين userId من المستخدم المسجل
      createdAt: Date.now(),
    });
  
    newComment.save().then(() => {
      res.status(201).json({
        message: "Comment Created Successfully",
        comment: newComment
      });
    }).catch(err => {
      next(err);
    });
  };
  
  // إضافة تقييم للتعليق
  exports.addRating = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: "Validation failed",
        errors: errors.array()
      });
    }
  
    const { commentId } = req.params;
    const { rating } = req.body;
  
    commentSchema.findById(commentId).then(comment => {
      if (!comment) {
        const error = new Error("No Comment Found With This ID...");
        error.statusCode = 404;
        throw error;
      }
  
      // التحقق من أن المستخدم لم يقم بالتقييم من قبل
      const existingRating = comment.ratings.find(r => r.userId.toString() === req.userData.userId.toString());
      if (existingRating) {
        const error = new Error("You have already rated this comment.");
        error.statusCode = 400;
        throw error;
      }
  
      comment.ratings.push({ userId: req.userData.userId, rating });
      return comment.save();
    }).then(result => {
      res.status(201).json({
        message: "Rating Added Successfully",
        comment: result
      });
    }).catch(err => {
      next(err);
    });
  };
  
  // تعديل تعليق (مفتوح للمسؤولين فقط)
  exports.editComment = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: "Validation failed",
        errors: errors.array()
      });
    }
  
    const commentId = req.params.id;
    const updatedComment = req.body.comment;
  
    commentSchema.findByIdAndUpdate(commentId, { comment: updatedComment }, { new: true }).then(result => {
      if (!result) {
        const error = new Error("No Comment Found With This ID...");
        error.statusCode = 404;
        throw error;
      }
      res.status(200).json({
        message: "Comment Updated Successfully",
        comment: result
      });
    }).catch(err => {
      next(err);
    });
  };
  
  // حذف تعليق (مفتوح للمسؤولين فقط)
  exports.deleteComment = (req, res, next) => {
    const commentId = req.params.id;
  
    commentSchema.findByIdAndRemove(commentId).then(result => {
      if (!result) {
        const error = new Error("No Comment Found With This ID...");
        error.statusCode = 404;
        throw error;
      }
      res.status(200).json({ message: "Comment Deleted Successfully" });
    }).catch(err => {
      next(err);
    });
  };
  
  // الحصول على تعليقات مستخدم معين
  exports.getUserComments = (req, res, next) => {
    const currentPage = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
  
    commentSchema.find({ userId: req.userData.userId }).countDocuments().then(count => {
      if (!count) {
        const error = new Error("No Comments Found For This User...");
        error.statusCode = 404;
        throw error;
      }
      return commentSchema.find({ userId: req.userData.userId })
        .skip((currentPage - 1) * limit)
        .limit(limit)
        .sort({ createdAt: -1 });
    }).then(result => {
      res.status(200).json({ comments: result });
    }).catch(err => {
      next(err);
    });
  };