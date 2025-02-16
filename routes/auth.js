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
 
 // عرض المستخدمين
 route.get('/users', isAuth, usersFilter.userfilter, authControllers.getUsers);
 
 // تغيير حالة المستخدم
 route.put('/user-status/:id', isAuth, authControllers.changeUserStatus);
 
 // حذف مستخدم
 route.delete('/user/:id', isAuth, authControllers.deleteUser);
 
 
 module.exports = route;