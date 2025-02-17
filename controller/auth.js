
const {validationResult} = require('express-validator');
const User = require('../models/users');
const bcrypt = require("bcryptjs");
const jwt = require('jsonwebtoken');
require('dotenv').config();

exports.login = async (req, res, next) => {
    let userLogedIn;
    const errors = validationResult(req);
    
    // التحقق من وجود أخطاء في التحقق من البيانات
    if (!errors.isEmpty()) {
        const err = new Error("Validation Failed");
        err.statusCode = 422;
        err.data = errors.array();
        throw err;
    }

    const { email, password, role } = req.body;

    try {
        // البحث عن المستخدم في قاعدة البيانات
        const user = await User.findOne({ email });
        if (!user) {
            const err = new Error("A user with this email could not be found");
            err.statusCode = 401;
            throw err;
        }
        userLogedIn = user;

        // مقارنة كلمة المرور المدخلة مع كلمة المرور المخزنة
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            const err = new Error("Invalid Password");
            err.statusCode = 401;
            throw err;
        }

        // التحقق من الدور
        if (userLogedIn.role !== role) {
            const err = new Error("Invalid User Role");
            err.statusCode = 401;
            throw err;
        }

        // التحقق من حالة المستخدم إذا كانت "مفعل"
        if (userLogedIn.role === 'user' && userLogedIn.status !== 'Active') {
            const err = new Error("Your Account is Inactive. Please Contact with Administrator");
            err.statusCode = 401;
            throw err;
        }

        // توليد التوكن عند التحقق بنجاح
        const token = jwt.sign(
            {
                email: userLogedIn.email,
                userId: userLogedIn._id.toString()
            },
            process.env.JWT_SECRET, // استخدم المتغير البيئي هنا
            { expiresIn: "10h" }
        );
        

        // إرسال التوكن والمعلومات للمستخدم
        res.status(200).json({
            userId: userLogedIn._id.toString(),
            token: token
        });
 
    } catch (err) {
        // التعامل مع الأخطاء بشكل موحد
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err); // تمريغ الخطأ إلى ميدلوير الخطأ
    }
};

exports.register = (req, res, next) => {
    const error = validationResult(req);
    if (!error.isEmpty()) {
        const err = new Error("Validation Failed");
        err.statusCode = 422;
        err.data = error.array();
        throw err;
    }

    const { email, username, password, firstName, lastName } = req.body;

    User.findOne({ email: email }).then(user => {
        if (user) {
            const err = new Error("A user with this email already exists");
            err.statusCode = 400;
            throw err;
        } else {
            return bcrypt.hash(password, 12);
        }
    }).then(hashResult => {
        const newUser = new User({
            email: email,
            username: username,
            password: hashResult,
            firstName: firstName,
            lastName: lastName
        });

        return newUser.save();
    }).then(success => {
        const token = jwt.sign({
            email: email,
            userId: success._id.toString()
        }, "MohamedYossryFaxil", { expiresIn: "1h" });

        res.status(201).json({
            userId: success._id.toString(),
            token: token
        });
    }).catch(err => {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    });
};


exports.getComments = async (req, res, next) => {
    try {
        const currentPage = parseInt(req.query.page) || 1; // الصفحة الحالية (افتراضيًا 1)
        const limit = parseInt(req.query.limit) || 10; // عدد العناصر في الصفحة (افتراضيًا 10)

        // حساب عدد الصفحات
        const totalComments = await Comment.countDocuments(); // إجمالي عدد التعليقات
        const totalPages = Math.ceil(totalComments / limit); // عدد الصفحات

        // جلب التعليقات مع التقسيم إلى صفحات
        const comments = await Comment.find()
            .skip((currentPage - 1) * limit) // تخطي التعليقات السابقة
            .limit(limit) // تحديد عدد التعليقات في الصفحة
            .sort({ createdAt: -1 }); // ترتيب التعليقات من الأحدث إلى الأقدم

        // إرجاع الـ Response
        res.status(200).json({
            comments: comments,
            totalComments: totalComments,
            totalPages: totalPages,
            currentPage: currentPage
        });
    } catch (err) {
        next(err); // تمرير الخطأ إلى المعالج التالي
    }
};


exports.deleteUser = (req, res, next) => {
    User.findById(req.params.id).then(result => {
        if (!result) {
            let error = new Error("No Task Found With This ID...")
            error.statusCode = 404;
            throw error
        }
    }).then(status => {
        User.findByIdAndRemove(req.params.id).then(result => {
            res.status(200).json({ massage: "User Deleted Successfully" })
        })
    })

}

exports.changeUserStatus = (req, res, next) => {
    let userId = req.params.id; // استخدم params بدلاً من body للحصول على الـ ID
    
    // العثور على المستخدم حسب الـ ID
    User.findById(userId).then(result => {
      if (!result) {
        const err = new Error("User not found");
        err.statusCode = 404; // 404 بدلاً من 401 لأن المستخدم غير موجود
        throw err;
      }
  
      // عكس حالة المستخدم
      result.isActive = !result.isActive; // عكس القيمة (إذا كان نشطًا يصبح غير نشط، والعكس)
      
      return result.save(); // حفظ التغييرات
    }).then(updatedUser => {
      res.status(200).json({
        user: updatedUser,
        message: "User status updated successfully"
      });
    }).catch(err => {
      next(err); // تمرير الخطأ إلى المعالج التالي
    });
  };

  exports.updateUser = (req, res, next) => {
    const userId = req.params.id;
    const { email, username, firstName, lastName, role } = req.body;
  
    // التحقق من وجود البيانات
    if (!email || !username || !firstName || !lastName || !role) {
      const error = new Error('All fields are required');
      error.statusCode = 400;
      throw error;
    }
  
    User.findById(userId).then(user => {
      if (!user) {
        const error = new Error('User not found');
        error.statusCode = 404;
        throw error;
      }
  
      // تحديث البيانات
      user.email = email;
      user.username = username;
      user.firstName = firstName;
      user.lastName = lastName;
      user.role = role;
  
      // حفظ البيانات المعدلة
      return user.save();
    }).then(updatedUser => {
      res.status(200).json({
        message: 'User updated successfully',
        user: updatedUser
      });
    }).catch(err => {
      next(err);
    });
  };
  
  