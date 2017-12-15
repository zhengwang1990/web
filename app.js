var express        = require("express"),
    app            = express(),
    mongoose       = require("mongoose"),
    bodyParser     = require("body-parser"),
    methodOverride = require("method-override"),
    path           = require('path'),
    formidable     = require('formidable'),
    fs             = require('fs'),
    passport       = require("passport"),
    cookieParser   = require("cookie-parser"),
    LocalStrategy  = require("passport-local"),
    session        = require("express-session"),
    flash          = require("connect-flash");
    
// seed
var seedDB = require("./seeds");
 
// database
var Profile = require("./models/profile"),
 	Info    = require("./models/info"),
 	User    = require("./models/user");
 	
// passport configuration
app.use(session({
    secret: "Any text which makes a secret",
    resave: false,
    saveUninitialized: false
}));

mongoose.Promise = global.Promise;
mongoose.connect("mongodb://localhost/develop", {
  useMongoClient: true,
});
app.use(bodyParser.urlencoded({extended: true}));
app.use(methodOverride("_method"));
app.use(cookieParser('secret'));
app.use(express.static("public"));
app.use(flash());
app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

seedDB();

app.use(function(req, res, next){
   res.locals.currentUser = req.user;
   res.locals.success = req.flash('success');
   res.locals.error = req.flash('error');
   next();
});

function isLoggedIn(req, res, next){
	if(req.isAuthenticated()){
		return next();
	}
	req.flash("error", "你需要登录才能进行操作");
	res.redirect("/login");
}

// homepage
app.get("/", function(req, res){
	Profile.find({}, function(err, profiles){
		if (err) {
			console.log(err);
		} else {
			Info.findOne({}, function(err, info){
				if (err) {
					console.log(err);
				} else {
					res.render("index.ejs", {profiles:profiles, info:info});
				}
			});
		}
	});
});

// admin page
app.get("/admin", isLoggedIn, function(req, res, err){
	Profile.find({}, function(err, profiles){
		if (err) {
			console.log(err);
		} else {
			Info.findOne({}, function(err, info){
				if (err) {
					console.log(err);
				} else {
					res.render("admin.ejs", {profiles:profiles, info:info});
				}
			});
		}
	});
});

// edit info GET form
app.get("/info_update", isLoggedIn, function(req, res){
	Info.findOne({}, function(err, info){
		if (err) {
			console.log(err);
		} else {
			res.render("info_update.ejs", {info:info});
		}
	});
});

// update info PUT route
app.put("/info_update", isLoggedIn, function(req, res){
	Info.findOne({}, function(err, info){
		req.body.info.show_notice = Boolean(req.body.info.show_notice);
		info.update(req.body.info, function(err, updated_info){
			if (err) {
				console.log(err);
			}
		});
		res.redirect("/admin");
	});
});

// create NEW profile GET form
app.get("/new", isLoggedIn, function(req, res){
	res.render("new.ejs");
});

// create NEW profile post route
app.post("/new", isLoggedIn, function(req, res){
	req.body.profile.images = req.body.profile.images.split(",");
	Profile.create(req.body.profile, function(err){
		if (err) {
			console.log(err);
		} else {
			res.redirect("admin");	
		};
	}); 
});

// upload file route
app.post("/upload", isLoggedIn, function(req, res){
  // create an incoming form object
  var form = new formidable.IncomingForm();
  var new_name;
	
  // specify that we want to allow the user to upload multiple files in a single request
  form.multiples = false;

  // store all uploads in the /uploads directory
  date_str = new Date().toISOString().replace(/\T.+/, '').replace(/-/g, '')
  form.uploadDir = "./public/uploads/" + date_str;
  
  if (!fs.existsSync(form.uploadDir)){
    fs.mkdirSync(form.uploadDir);
  }

  // every time a file has been uploaded successfully,
  // rename it to it's orignal name
  form.on("file", function(field, file) {
  	new_name = file.path + "_" + file.name;
    fs.rename(file.path, new_name, function(err){
    	if (err) {
    		console.log(err);
		}
    });
  });

  // log any errors that occur
  form.on("error", function(err) {
    console.log(err);
  });

  // once all the files have been uploaded, send a response to the client
  form.on("end", function(err) {
    res.send(new_name.slice(6));
  });

  // parse the incoming request containing the form data
  form.parse(req);
});

// edit profile GET form
app.get("/edit/:id", function(req, res){
	Profile.findById(req.params.id, function(err, profile){
		if (err) {
			console.log(err);
		} else {
        	res.render("edit.ejs", {profile: profile});
    	}
    });
});

// update profile PUT route
app.put("/:id", isLoggedIn, function(req, res){
	if (req.body.profile.images) {
		req.body.profile.images = req.body.profile.images.split(";");
	} else {
		req.body.profile.images = [];
	}
	Profile.findByIdAndUpdate(req.params.id, req.body.profile, function(err, updated_profile){
    	if(err){
    		console.log(err);
    	} else {
    		res.redirect("/admin#" + String(req.params.id));
    	}
    });
});

// destroy profile DELETE route
app.delete("/:id", isLoggedIn, function(req, res){
	Profile.findByIdAndRemove(req.params.id, function(err){
      if(err){
          console.log(err);
      } else {
          res.redirect("/admin");
      }
   });
});

// show login form
app.get("/login", function(req, res){
	res.render("login.ejs"); 
});

// handling login logic
app.post("/login", passport.authenticate("local", 
	{
    	successRedirect: "/admin",
        failureRedirect: "/login",
        failureFlash: "用户名或密码不正确"
    }), function(req, res){
});

// logout route
app.get("/logout", function(req, res){
   req.logout();
   req.flash("success", "你已经退出登录");
   res.redirect("/");
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