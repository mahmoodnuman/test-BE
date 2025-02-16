
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

exports.getUsers = (req , res , next) => {
    let currentPage = req.query.page,
    limit = req.query.limit;
    User.find( {
        ...res.locals.userfilter ,
        _id: {
            $ne:req.userData.userId
        }
    }).countDocuments().then(search => {
        totalItems = search;
        return User.find({
            ...res.locals.userfilter ,
            _id: {
                $ne:req.userData.userId
            }
        }).select('-password').sort({ updatedAt: -1 }).skip((currentPage - 1) * limit).limit(limit)
       
    }).then(result => {
        if (!result) {
            const error = new Error("No Users Found")
            error.statusCode = 200;
            throw error
        } else {
            res.status(200).json({
                users: result,
                totalItems: totalItems
            })
        }
    }).catch(err => {
        const error = new Error("No Users Found")
        error.statusCode = 400
        throw error
    })
}


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

exports.changeUserStatus = (req , res , next) => {

    let userId = req.body.id,
        currentStatus = req.body.status;

        User.findById(userId).then(result => {
           if(!result) {
            const err = new Error("A user with this email could be not found");
            err.StatusCode = 401;
            throw err
           } 
           User.findByIdAndUpdate(userId).then(user => {
            user.status = (currentStatus == "Active") ? "In-Active" : "Active"
            return user.save()
           
           }).then(success => {
                res.status(200).json({
                    user: success,
                    massage:"User Status Changed Successfully"
                })
           })
        })
}