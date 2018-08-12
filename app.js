var express        = require('express'),
    app            = express(),
    mongoose       = require('mongoose'),
    bodyParser     = require('body-parser'),
    methodOverride = require('method-override'),
    path           = require('path'),
    formidable     = require('formidable'),
    fs             = require('fs'),
    passport       = require('passport'),
    LocalStrategy  = require('passport-local'),
    session        = require('express-session'),
    flash          = require('connect-flash'),
    {google}       = require('googleapis');

// seed
var seedDB = require('./seeds');

// database
var Profile = require('./models/profile'),
    Info    = require('./models/info'),
    User    = require('./models/user');

mongoose.Promise = global.Promise;
mongoose.connect('mongodb://zhengwang:1990127@cluster0-shard-00-00-nssvf.mongodb.net:27017,cluster0-shard-00-01-nssvf.mongodb.net:27017,cluster0-shard-00-02-nssvf.mongodb.net:27017/test?ssl=true&replicaSet=Cluster0-shard-0&authSource=admin', {
    useMongoClient: true,
});
mongoose.connect('mongodb://localhost/lilihome', {
    useMongoClient: true
});

app.use(bodyParser.urlencoded({extended: true}));
app.use(methodOverride('_method'));
app.use(express.static('public'));
app.use(flash());

// passport configuration
app.use(session({
    secret: 'Any text which makes a secret',
    resave: false,
    saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

//seedDB();

app.use(function(req, res, next){
    res.locals.currentUser = req.user;
    res.locals.success = req.flash('success');
    res.locals.error = req.flash('error');
    next();
});


function authorize(filename, filepath, res, callback) {
    const credentials = JSON.parse(process.env.CREDENTIALS);
    const {client_secret, client_id, redirect_uris} = credentials.installed;
    const oAuth2Client = new google.auth.OAuth2(
	client_id, client_secret, redirect_uris[0]);
    const token = process.env.TOKEN;
    oAuth2Client.setCredentials(JSON.parse(token));
    callback(oAuth2Client, filename, filepath, res);
}


function isLoggedIn(req, res, next) {
    if(req.isAuthenticated()){
	return next();
    }
    req.flash('error', '你需要登录才能进行操作');
    res.redirect('/login');
}


// homepage
app.get('/', function(req, res){
    const poems = ['十年一觉扬州梦，赢得青楼薄幸名 --- 杜牧',
		   '二十四桥明月夜，玉人何处教吹箫 --- 杜牧',
		   '驰道杨花满御沟，红妆缦绾上青楼 --- 王昌龄',
		   '香帏风动花入楼，高调鸣筝缓夜愁 --- 王昌龄',
		   '罗襦宝带为君解，燕歌赵舞为君开 --- 卢照邻'];
    Profile.find({}, function(err, profiles){
	if (err) {
	    console.log(err);
	} else {
	    Info.findOne({}, function(err, info){
		if (err) {
		    console.log(err);
		} else {
		    var poem = poems[Math.floor(Math.random()*poems.length)]
		    res.render('index.ejs', {profiles:profiles, info:info, poem: poem});
		}
	    });
	}
    });
});

// admin page
app.get('/admin', isLoggedIn, function(req, res, err){
    Profile.find({}, function(err, profiles){
	if (err) {
	    console.log(err);
	} else {
	    Info.findOne({}, function(err, info){
		if (err) {
		    console.log(err);
		} else {
		    res.render('admin.ejs', {profiles:profiles, info:info});
		}
	    });
	}
    });
});

// edit info GET form
app.get('/info_update', isLoggedIn, function(req, res){
    Info.findOne({}, function(err, info){
	if (err) {
	    console.log(err);
	} else {
	    res.render('info_update.ejs', {info:info});
	}
    });
});

// update info PUT route
app.put('/info_update', isLoggedIn, function(req, res){
    Info.findOne({}, function(err, info){
	req.body.info.show_notice = Boolean(req.body.info.show_notice);
	info.update(req.body.info, function(err, updated_info){
	    if (err) {
		console.log(err);
	    }
	});
	res.redirect('/admin');
    });
});

// create NEW profile GET form
app.get('/new', isLoggedIn, function(req, res){
    res.render('new.ejs');
});

// create NEW profile post route
app.post('/new', isLoggedIn, function(req, res){
    if (req.body.profile.images) {
	req.body.profile.images = req.body.profile.images.split(';');
    } else {
	req.body.profile.images = [];
    }
    if (req.body.profile.videos) {
	req.body.profile.videos = req.body.profile.videos.split(';');
    } else {
	req.body.profile.videos = [];
    }
    Profile.create(req.body.profile, function(err){
	if (err) {
	    console.log(err);
	} else {
	    res.redirect('admin');	
	};
    }); 
});

// upload file route
// ref: https://coligo.io/building-ajax-file-uploader-with-node/
app.post('/upload_image', isLoggedIn, function(req, res){
    // create an incoming form object
    var form = new formidable.IncomingForm();
    
    // specify that we want to allow the user to upload multiple files in a single request
    form.multiples = false;

    // store all uploads in the /uploads directory
    form.uploadDir = './uploads'
    
    // every time a file has been uploaded successfully,
    form.on('file', function(field, file) {
	var filepath = path.join(form.uploadDir, file.name);
	fs.rename(file.path, filepath, (err) => {
	    if (err) throw err;
	});
	authorize(file.name, filepath, res, createFile);
    });
    
    // parse the incoming request containing the form data
    form.parse(req);
});

app.post('/upload_video', isLoggedIn, function(req, res){
    // create an incoming form object
    var form = new formidable.IncomingForm();
    
    // specify that we want to allow the user to upload multiple files in a single request
    form.multiples = false;
    
    // store all uploads in the /uploads directory
    form.uploadDir = './uploads'
    
    if (!fs.existsSync(form.uploadDir)){
	fs.mkdirSync(form.uploadDir);
    }
    
    // every time a file has been uploaded successfully,
    form.on('file', function(field, file) {
	var filepath = path.join(form.uploadDir, file.name);
	fs.rename(file.path, filepath, (err) => {
	    if (err) throw err;
	});
	authorize(file.name, filepath, res, createVideo);
    });

    // parse the incoming request containing the form data
    form.parse(req);
});


async function createFile(auth, filename, filepath, res) {
    const drive = google.drive({version: 'v3', auth});
    const google_res = await drive.files.create({
	requestBody: {
	    name: filename,
	    parents: ['1b839ObCYW_FeOqa9iSok4WUoXN4Kz6x_']
	},
	media: {
	    body: fs.createReadStream(filepath)
	}
    });
    res.send('https://drive.google.com/uc?id='+google_res.data.id)
    fs.unlink(filepath, (err) => {
	if (err) throw err;
    });
}


async function createVideo(auth, filename, filepath, res) {
    const youtube = google.youtube({version: 'v3', auth});
    const filesize = fs.statSync(filepath).size;
    const google_res = await youtube.videos.insert({
	part: 'id,snippet,status',
	notifySubscribers: false,
	requestBody: {
	    snippet: {
		title: 'lilihome-video',
	    },
	    status: {
		privacyStatus: 'public'
	    }
	},
	media: {
	    body: fs.createReadStream(filepath)
	}
    });
    res.send('https://www.youtube.com/embed/'+google_res.data.id)
    fs.unlink(filepath, (err) => {
	if (err) throw err;
    });
}

// edit profile GET form
app.get('/edit/:id', isLoggedIn, function(req, res){
    Profile.findById(req.params.id, function(err, profile){
	if (err) {
	    console.log(err);
	} else {
	    res.render('edit.ejs', {profile: profile});
    	}
    });
});

// update profile PUT route
app.put('/:id', isLoggedIn, function(req, res){
    if (req.body.profile.images) {
	req.body.profile.images = req.body.profile.images.split(';');
    } else {
	req.body.profile.images = [];
    }
    if (req.body.profile.videos) {
	req.body.profile.videos = req.body.profile.videos.split(';');
    } else {
	req.body.profile.videos = [];
    }
    Profile.findByIdAndUpdate(req.params.id, req.body.profile, function(err, updated_profile){
    	if(err){
    	    console.log(err);
    	} else {
    	    res.redirect('/admin#' + String(req.params.id));
    	}
    });
});

// destroy profile DELETE route
app.delete('/:id', isLoggedIn, function(req, res){
    Profile.findByIdAndRemove(req.params.id, function(err){
	if(err){
            console.log(err);
	} else {
            res.redirect('/admin');
	}
    });
});

// show login form
app.get('/login', function(req, res){
    res.render('login.ejs'); 
});

// handling login logic
app.post('/login', passport.authenticate('local', 
					 {
    					     successRedirect: '/admin',
					     failureRedirect: '/login',
					     failureFlash: '用户名或密码不正确'
					 }), function(req, res){});

// logout route
app.get('/logout', function(req, res){
    req.logout();
    req.flash('success', '你已经退出登录');
    res.redirect('/');
});


if (module === require.main) {
    // Start the server
    // [START server]
    const server = app.listen(process.env.PORT || 8080, () => {
	const port = server.address().port;
	console.log(`App listening on port ${port}`);
    });
    // [END server]
}
