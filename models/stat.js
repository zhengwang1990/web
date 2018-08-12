var mongoose = require("mongoose");

var statSchema = new mongoose.Schema({
    homepage: {
	type: Map,
	of: Number
    }
});

module.exports = mongoose.model("Stat", statSchema);
