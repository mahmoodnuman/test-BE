const express = require('express');
const commentRoute = require("./routes/admin"); // ملف routes التعليقات
const authRoute = require("./routes/auth"); // ملف routes المصادقة
const app = express();
const bodyParser = require("body-parser");
const DBConcction = require('./util/database').DBConcction; // الاتصال بقاعدة البيانات
const multer = require('multer'); // لتحميل الملفات
const path = require("path"); // للتعامل مع مسارات الملفات
const swaggerUi = require('swagger-ui-express'); // لتوثيق API
const swaggerDocument = require('./swagger.json'); // ملف توثيق Swagger
require("dotenv").config(); // لتحميل المتغيرات البيئية

const port = process.env.PORT || 3000; // استخدام المتغير البيئي أو القيمة الافتراضية

// إعدادات multer لتحميل الصور
const fileStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'images'); // حفظ الصور في مجلد images
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname); // استخدام الاسم الأصلي للصورة
  }
});

// فلتر لتحميل أنواع معينة من الصور
const fileFilter = (req, file, cb) => {
  if (
    file.mimetype === 'image/png' ||
    file.mimetype === 'image/jpg' ||
    file.mimetype === 'image/jpeg'
  ) {
    cb(null, true); // السماح بتحميل الصورة
  } else {
    cb(null, false); // رفض تحميل الصورة
  }
};

// Middleware لتمكين CORS
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*"); // السماح لجميع الأصول
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE"); // السماح بهذه الطلبات
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization"); // السماح بهذه الـ headers
  next();
});

// Middleware لتحليل طلبات JSON
app.use(bodyParser.json());

// Middleware لتحميل الصور
app.use(
  multer({ storage: fileStorage, fileFilter: fileFilter }).single('image')
);

// Middleware لتوفير الوصول إلى مجلد الصور
app.use('/images', express.static(path.join(__dirname, 'images')));

// Middleware لتوثيق API باستخدام Swagger
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// استخدام routes التعليقات
app.use('/comment', commentRoute);

// استخدام routes المصادقة
app.use('/auth', authRoute);

// Middleware لمعالجة الأخطاء
app.use((error, req, res, next) => {
  const status = error.statusCode || 500; // الحصول على كود الخطأ أو استخدام 500 كقيمة افتراضية
  const message = error.message; // الحصول على رسالة الخطأ
  res.status(status).json({ message: message }); // إرسال الرد مع رسالة الخطأ
});

// الاتصال بقاعدة البيانات وبدء تشغيل الخادم
DBConcction(() => {
  app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
  });
});