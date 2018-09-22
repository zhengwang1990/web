var mongoose = require("mongoose");

var infoSchema = new mongoose.Schema({
    wechat: String,
    phone: String,
    notice: String,
    show_notice: Boolean,
    allow_like: Boolean,
    allow_dislike: Boolean,
    allow_comments: Boolean,
});

module.exports = mongoose.model("Info", infoSchema);
