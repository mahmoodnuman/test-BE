exports.userfilter = (req, res, next) => {
    let queries = req.query;
    let filteration = {};

    Object.entries(queries).forEach(([key, value]) => {
        if (value && key !== 'page' && key !== "limit") {
            if (key === "name") {
                // البحث في اسم المستخدم (username)
                filteration['username'] = { $regex: value, $options: 'i' };
            } else if (key === "email") {
                // البحث في البريد الإلكتروني (email)
                filteration['email'] = { $regex: value, $options: 'i' };
            }
        }
    });

    res.locals.userfilter = filteration;
    next();
};