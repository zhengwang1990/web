var mongoose = require("mongoose");

var profileSchema = new mongoose.Schema({
    name: String,
    description: String,
    images: [String],
    videos: [String],
    comments: [String],
    likes: {
	type: Number,
	default: 0
    },
    dislikes: {
	type: Number,
	default: 0
    },
    lastday: String
});

module.exports = mongoose.model("Profile", profileSchema);
