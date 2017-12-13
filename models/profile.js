var mongoose = require("mongoose");

var profileSchema = new mongoose.Schema({
   name: String,
   description: String,
   images: [String]
});

module.exports = mongoose.model("Profile", profileSchema);