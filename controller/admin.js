const { validationResult } = require('express-validator');
const commentSchema = require('../models/admin');
const userSchema = require('../models/users');
const path = require('path');
const fs = require('fs');

exports.getComments = (req, res, next) => {
    const currentPage = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    let totalItems;

    commentSchema.countDocuments().then(count => {
        totalItems = count;
        return commentSchema.find().skip((currentPage - 1) * limit).limit(limit).sort({ createdAt: -1 });
    }).then(result => {
        res.status(200).json({
            comments: result,
            totalItems: totalItems
        });
    }).catch(err => {
        next(err);
    });
};

exports.createComment = (req, res, next) => {
    const err = validationResult(req);
    if (!err.isEmpty()) {
        return res.status(400).json({
            message: "Comment is invalid",
            errors: err.array()
        });
    }

    if (!req.body.userId) {
        const error = new Error('User ID is required');
        error.statusCode = 400;
        return next(error);
    }

    const newComment = new commentSchema({
        comment: req.body.comment,
        userId: req.body.userId,
        createdAt: Date.now(),
    });

    newComment.save().then(() => {
        res.status(201).json({
            message: "Comment Created Successfully"
        });
    }).catch(err => {
        next(err);
    });
};

exports.editComment = (req, res, next) => {
    const err = validationResult(req);
    if (!err.isEmpty()) {
        return res.status(400).json({
            message: "Comment is invalid",
            errors: err.array()
        });
    }

    const commentId = req.params.id;
    const updatedComment = req.body.comment;

    commentSchema.findByIdAndUpdate(commentId, { comment: updatedComment }, { new: true }).then(result => {
        if (!result) {
            const error = new Error("No Comment Found With This ID...");
            error.statusCode = 404;
            return next(error);
        }
        res.status(200).json({
            message: "Comment Updated Successfully"
        });
    }).catch(err => {
        next(err);
    });
};

exports.deleteComment = (req, res, next) => {
    const commentId = req.params.id;

    commentSchema.findByIdAndRemove(commentId).then(result => {
        if (!result) {
            const error = new Error("No Comment Found With This ID...");
            error.statusCode = 404;
            return next(error);
        }
        res.status(200).json({ message: "Comment Deleted Successfully" });
    }).catch(err => {
        next(err);
    });
};

exports.getUserComments = (req, res, next) => {
    const currentPage = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    commentSchema.find({ userId: req.userData.userId }).countDocuments().then(count => {
        if (!count) {
            const error = new Error("No Comments Found For This User...");
            error.statusCode = 400;
            return next(error);
        }
        return commentSchema.find({ userId: req.userData.userId }).skip((currentPage - 1) * limit).limit(limit).sort({ createdAt: -1 });
    }).then(result => {
        res.status(200).json({ comments: result });
    }).catch(err => {
        next(err);
    });
};

exports.commentDetails = (req, res, next) => {
    const commentId = req.params.id;

    commentSchema.findById(commentId).then(result => {
        if (!result) {
            const error = new Error("No Comment Found With This ID...");
            error.statusCode = 400;
            return next(error);
        }
        res.status(200).json({ comment: result });
    }).catch(err => {
        next(err);
    });
};
