var mongoose = require("mongoose");

var infoSchema = new mongoose.Schema({
    wechat: String,
    phone: String,
    notice: String,
    show_notice: Boolean,
    allow_thumbs: Boolean,
    allow_comments: Boolean,
});

module.exports = mongoose.model("Info", infoSchema);
