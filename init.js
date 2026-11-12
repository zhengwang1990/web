var Profile = require("./models/profile"),
    Info    = require("./models/info"),
    User    = require("./models/user"),
    Stat    = require('./models/stat');

async function initDB() {
  var infos = await Info.find({});
  if (infos.length != 1) {
    await Info.deleteMany({});
    await Info.create({});
  }

  var stats = await Stat.find({});
  if (stats.length != 1) {
    await Stat.deleteMany({});
    await Stat.create({homepage: {}});
  }

  var users = await User.find({});
  if (users.length != 1) {
    await User.deleteMany({});
    if (!process.env.USERNAME) throw new Error('username not provided');
    var newUser = new User({username: process.env.USERNAME});
    await User.register(newUser, process.env.PASSWORD);
  }
}

module.exports = initDB;
