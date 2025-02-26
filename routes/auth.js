const express = require('express')
const route = express.Router()
const {body} = require('express-validator')
const User = require('../models/users')
const authControllers = require('../controller/auth')
const isAuth = require('../middleware/is-auth')
const usersFilter = require('../controller/users-filter')

route.post('/login',
     body('email').trim().isEmail().withMessage("Please Enter Valid Email").normalizeEmail(),
     body("password").trim().isLength({ min: 3 }),
     authControllers.login
 );
 
 // إنشاء حساب جديد
 route.post('/createAccount',
     body('email').trim().isEmail().withMessage("Please Enter Valid Email").normalizeEmail(),
     body('username').trim().notEmpty().withMessage("Username is required."),
     body('password').trim().isLength({ min: 3 }).withMessage("Password must be at least 3 characters long."),
     body('firstName').trim().notEmpty().withMessage("First name is required."),
     body('lastName').trim().notEmpty().withMessage("Last name is required."),
     authControllers.register
 );

 route.put('/user/:id', isAuth, 
    body('email').trim().isEmail().withMessage("Please enter a valid email").normalizeEmail(),
    body('username').trim().notEmpty().withMessage("Username is required."),
    body('firstName').trim().notEmpty().withMessage("First name is required."),
    body('lastName').trim().notEmpty().withMessage("Last name is required."),
    body('role').trim().notEmpty().withMessage("Role is required."),
    authControllers.updateUser
  );

  // في ملف routes/users.js

route.get('/user/:id', isAuth, async (req, res) => {
    try {
        const userId = req.params.id;  // استخراج userId من الـ URL
        const user = await User.findById(userId);  // البحث عن المستخدم باستخدام الـ userId
        
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // إرجاع بيانات المستخدم
        res.status(200).json({
            _id: user._id,
            username: user.username,  // يمكن إضافة المزيد من البيانات إذا لزم الأمر
            profilePicture: user.profilePicture
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error fetching user data' });
    }
});

  
 
 // عرض المستخدمين
 route.get('/users', isAuth, usersFilter.userfilter, authControllers.getUsers);
 
 // تغيير حالة المستخدم
 route.put('/user-status/:id', isAuth, authControllers.changeUserStatus); 
 
 // حذف مستخدم
 route.delete('/user/:id', isAuth, authControllers.deleteUser);
 
 
 module.exports = route;