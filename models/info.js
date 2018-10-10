var mongoose = require("mongoose");

var infoSchema = new mongoose.Schema({
    wechat: String,
    phone: String,
    notice: String,
    access_code: String,
    show_notice: Boolean,
    allow_like: Boolean,
    allow_dislike: Boolean,
    allow_comments: Boolean,
    enable_access_code: Boolean,
});

module.exports = mongoose.model("Info", infoSchema);
