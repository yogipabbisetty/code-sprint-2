const mongoose = require('mongoose');


const User = new mongoose.Schema({
    p: {
        type: String,
        required: true
    },
    username:{
        type: String,
        required: true
    },
    m: {
        type: String,
        required: true
    },
    isverified: {
        type: Boolean,
        default: false
    },
    otp: {
        type: Number
    },
    mobile: {
        type: String,
        required: true
    },
    accounts: {
        type: Array,
        default: []
    },
})
module.exports = mongoose.model("User", User);
