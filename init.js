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

  User.find({}, function(err, users) {
    if (err) throw err;
    if (users.length != 1) {
      User.remove({}, function(err) {
        if (err) throw err;
        if (!process.env.USERNAME) throw new Error('username not provided');
        var newUser = new User({username: process.env.USERNAME});
        User.register(newUser, process.env.PASSWORD, function(err, user){
          if (err) throw err;
        });
      });
    }
  });
}

module.exports = initDB;
