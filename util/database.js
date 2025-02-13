const mongoose = require("mongoose");

const DBConcction = callback => {
    mongoose.connect(process.env.MONGO_URL)
    .then(() => {
        console.log("DB Connected!!");
        
        // تنفيذ الكولباك بعد الاتصال الناجح
        callback();

        // عرض رابط الـ localhost في الـ console بعد الاتصال الناجح
        console.log(`Server is running on http://localhost:${process.env.PORT || 5000}`);
    })
    .catch(err => {
        console.log("Error connecting to DB:", err);
    });
}

exports.DBConcction = DBConcction;
