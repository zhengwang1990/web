var mongoose = require("mongoose");

var infoSchema = new mongoose.Schema({
   wechat: String,
   phone: String,
   notice: String,
   show_notice: Boolean
});

module.exports = mongoose.model("Info", infoSchema);