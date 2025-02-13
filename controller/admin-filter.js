exports.filter = (req, res, next) => {
    let queries = req.query;
    let filteration = {};

    Object.entries(queries).forEach(([key, value]) => {
        if (value && key !== 'page' && key !== "limit") {
            if (key === "keyword") {
                // البحث في محتوى التعليق (comment)
                filteration['comment'] = { $regex: value, $options: 'i' }; // 'i' لتجاهل الحالة
            } else if (key === "fromDate" || key === "toDate") {
                // التصفية حسب تاريخ الإنشاء (createdAt)
                if (!filteration['createdAt']) {
                    filteration['createdAt'] = {};
                }
                if (key === "fromDate") {
                    filteration['createdAt']['$gte'] = new Date(value);
                }
                if (key === "toDate") {
                    filteration['createdAt']['$lte'] = new Date(value);
                }
            } else if (key === "userId") {
                // التصفية حسب المستخدم (إذا أردت إضافتها)
                filteration['userId'] = value;
            }
        }
    });

    res.locals.filter = filteration;
    next();
};