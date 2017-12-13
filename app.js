var express     = require("express"),
    app         = express(),
    mongoose    = require("mongoose"),
    bodyParser  = require("body-parser"),
    methodOverride = require("method-override");
    
// seed
var seedDB      = require("./seeds");
 
// database
var Profile = require("./models/profile");
 
mongoose.connect("mongodb://localhost/develop", {
  useMongoClient: true,
});
app.use(bodyParser.urlencoded({extended: true}));
app.use(methodOverride("_method"));
app.use(express.static(__dirname + "/public"));

seedDB();

app.get("/", function(req, res, err){
	Profile.find({}, function(err, profiles){
		if (err) {
			console.log(err);
		} else {
			res.render("index.ejs", {profiles:profiles});
		}
	});
});

if (module === require.main) {
  // [START server]
  // Start the server
  const server = app.listen(process.env.PORT || 8080, () => {
    const port = server.address().port;
    console.log(`App listening on port ${port}`);
  });
  // [END server]
}