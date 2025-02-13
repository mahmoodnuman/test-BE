const mongoose = require('mongoose');
const schema = mongoose.Schema;

const userSchema = new schema({
    username: {
        type: String,
        required: true,
        unique: true,
        minlength: 3,
        maxlength: 50
    },
    email: {
        type: String,
        required: true,
        unique: true,
        match: /.+\@.+\..+/ // التأكد من أن البريد الإلكتروني صالح
    },
    password: {
        type: String,
        required: true,
        minlength: 6
    },
    firstName: {
        type: String,
        required: true
    },
    lastName: {
        type: String,
        required: true
    },
    profilePicture: {
        type: String, 
        default: 'default-avatar.png'
    },
    role: {
        type: String,
        enum: ['user', 'admin'],
        default: 'user' // القيمة الافتراضية هي 'user'
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date
    }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);