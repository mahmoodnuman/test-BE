const isAdmin = (req, res, next) => {
    if (req.userData && req.userData.role === 'admin') {
        next(); // المستخدم هو admin، يتم السماح بالوصول
    } else {
        res.status(403).json({ message: 'غير مصرح به: يجب أن تكون مسؤولاً' });
    }
};

module.exports = isAdmin;