const express = require('express');
const router = express.Router();
const commentsController = require('../controllers/admin'); // ملف controllers التعليقات
const isAuth = require('../middleware/is-auth'); // middleware للتحقق من المصادقة
const isAdmin = require('../middleware/is-admin'); // middleware للتحقق من صلاحيات المسؤول
const { body } = require('express-validator'); // للتحقق من صحة البيانات

// الحصول على جميع التعليقات (مفتوح للمستخدمين والمسؤولين)
router.get('/all-comment', isAuth, commentsController.getComments);

// الحصول على تعليقات مستخدم معين (مفتوح للمستخدمين والمسؤولين)
router.get('/user-comment/:id', isAuth, commentsController.getUserComments);

// إضافة تعليق جديد (مفتوح للمستخدمين فقط)
router.post(
  '/add-comment',
  isAuth,
  [
    body('comment').trim().isLength({ min: 1 }).withMessage('التعليق لا يمكن أن يكون فارغًا')
  ],
  commentsController.createComment
);

// إضافة تقييم للتعليق (مفتوح للمستخدمين فقط)
router.post(
  '/add-rating/:commentId',
  isAuth,
  [
    body('rating').isInt({ min: 1, max: 5 }).withMessage('التقييم يجب أن يكون بين 1 و 5')
  ],
  commentsController.addRating
);

// تعديل تعليق (مفتوح للمسؤولين فقط)
router.put(
  '/edit-comment/:id',
  isAuth,
  isAdmin,
  [
    body('comment').trim().isLength({ min: 1 }).withMessage('التعليق لا يمكن أن يكون فارغًا')
  ],
  commentsController.editComment
);

// حذف تعليق (مفتوح للمسؤولين فقط)
router.delete('/delete-comment/:id', isAuth, isAdmin, commentsController.deleteComment);

module.exports = router;