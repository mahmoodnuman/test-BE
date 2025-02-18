const mongoose = require("mongoose");

const DBConcction = callback => {
    mongoose.connect(process.env.MONGO_URL)
    .then(() => {
        console.log("DB Connected!!");
        
        // تنفيذ الكولباك بعد الاتصال الناجح
        callback();

    })
    .catch(err => {
        console.log("Error connecting to DB:", err);
    });
}

exports.DBConcction = DBConcction;
