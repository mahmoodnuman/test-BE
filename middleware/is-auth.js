require('dotenv').config();
const jwt = require('jsonwebtoken');
const secretKey = process.env.JWT_SECRET;

module.exports = (req, res, next) => {
    let decodedToken;
    console.log(secretKey);
    // التحقق من وجود token في header
    if (!req.get('Authorization')) {
        const error = new Error("Not Authenticated: No token provided.");
        error.statusCode = 401;
        throw error;
    }   

    // استخراج token من header
    const token = req.get('Authorization').split(' ')[1];
    try {
        // فك تشفير token
        decodedToken = jwt.verify(token, secretKey);
        req.userData = decodedToken; // إسناد بيانات المستخدم إلى req.userData
    } catch (err) {
        err.statusCode = 401; // 401 لأن الخطأ متعلق بالمصادقة
        err.message = "Not Authenticated: Invalid or expired token.";
        throw err;
    }

    if (!decodedToken) {
        const error = new Error("Not Authenticated: Token verification failed.");
        error.statusCode = 401;
        throw error;
    }

    // الانتقال إلى middleware التالي
    next();
};