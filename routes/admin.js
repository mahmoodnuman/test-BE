const express = require('express');
const commentsControllers = require('../controller/admin');
const commentsFilter = require('../controller/admin-filter');
const isAuth = require('../middleware/is-auth'); // تأكد من المسار الصحيح
const isAdmin = require('../middleware/isAdmin'); // تأكد من المسار الصحيح
const route = express.Router();
const { body } = require('express-validator');


route.get('/all-comment', isAuth, commentsFilter.filter, commentsControllers.getComments);

route.get('/user-comment/:id', isAuth, commentsFilter.filter, commentsControllers.getUserComments);


route.post(
    '/add-comment',
    isAuth,
    [
        body('comment').trim().isLength({ min: 1 }).withMessage('التعليق لا يمكن أن يكون فارغًا')
    ],
    commentsControllers.createComment
);

// إضافة تقييم للتعليق (مفتوح للمستخدمين فقط)
route.post(
    '/add-rating/:commentId',
    isAuth,
    [
        body('rating').isInt({ min: 1, max: 5 }).withMessage('التقييم يجب أن يكون بين 1 و 5'),
        body('rating').not().isEmpty().withMessage('يجب تقديم تقييم')
    ],
    commentsControllers.addRating
);


route.put(
    '/edit-comment/:id',
    isAuth,
    [
        body('comment').trim().isLength({ min: 1 }).withMessage('التعليق لا يمكن أن يكون فارغًا')
    ],
    commentsControllers.editComment
);

route.delete('/delete-comment/:id', isAuth, commentsControllers.deleteComment);

module.exports = route;
