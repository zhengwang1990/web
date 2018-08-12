var Profile = require("./models/profile"),
    Info    = require("./models/info"),
    User    = require("./models/user"),
    Stat    = require('./models/stat');

function initDB() {
    Info.find({}, function(err, infos) {
	if (err) throw err;
	if (infos.length != 1) {
	    Info.remove({}, function(err){
		if (err) throw err;
		Info.create({}, function(err, info){
		    if (err) throw err;
		});
	    });
	}
    });

    Stat.find({}, function(err, stats) {
	if (err) throw err;
	if (stats.length != 1) {
	    Stat.remove({}, function(err) {
		if (err) throw err;
		Stat.create({homepage: {}}, function(err, stat){
		    if (err) throw err;
		});
	    });
	}
    });
}

module.exports = initDB;
