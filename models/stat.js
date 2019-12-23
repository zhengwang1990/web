var mongoose = require("mongoose");

var statSchema = new mongoose.Schema({
  homepage: {
    type: Map,
    of: Number
  },
  cities: [String]
});

module.exports = mongoose.model("Stat", statSchema);
