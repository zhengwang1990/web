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
    moment         = require('moment-timezone'),
    {google}       = require('googleapis'),
    geoip          = require('geoip-lite'),
    cloudinary     = require('cloudinary').v2;

// seed & init
var seedDB = require('./seeds');
var initDB = require('./init');

// database
var Profile = require('./models/profile'),
    Info    = require('./models/info'),
    User    = require('./models/user'),
    Stat    = require('./models/stat');

mongoose.connect(process.env.MONGODB, {
  useNewUrlParser: true
});

var pieColors = ['#77b7c5', '#81B2AC', '#b184e8', '#e07f67', '#549abf',
     '#798584', '#cf8091', '#c474c0', '#ff8811'];

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
initDB();

app.use(function(req, res, next) {
  res.locals.currentUser = req.user;
  res.locals.success = req.flash('success');
  res.locals.error = req.flash('error');
  next();
});

cloudinary.config({
  cloud_name: 'zhengwang',
  api_key: '797236461388679',
  api_secret: process.env.CLOUDINARY_SECRET
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
  if (req.isAuthenticated()) {
    return next();
  }
  req.flash('error', '你需要登录才能进行操作');
  res.redirect('/login');
}

const poems = ['十年一觉扬州梦，赢得青楼薄幸名 --- 杜牧',
               '二十四桥明月夜，玉人何处教吹箫 --- 杜牧',
               '驰道杨花满御沟，红妆缦绾上青楼 --- 王昌龄',
               '香帏风动花入楼，高调鸣筝缓夜愁 --- 王昌龄',
               '罗襦宝带为君解，燕歌赵舞为君开 --- 卢照邻'];
const title = process.env.TITLE;
const header = process.env.HEADER;


function getIp(req) {
  return (req.headers['x-forwarded-for'] || '').split(',').pop().trim() || req.connection.remoteAddress;
}

function getCity(req) {
  var ip = getIp(req);
  if (ip) {
    var loc = geoip.lookup(ip);
    if (loc) {
      return loc.city;
    }
  }
}

function logRequest(req, message) {
  var ts = new Date(Date.now());
  var ip = getIp(req);
  console.log('[' + ts.toUTCString() + '] [' + ip + '] ' + message);
}

// homepage
app.get('/', function(req, res) {
  logRequest(req, 'GET / is requested');
  Info.findOne({}, function(err, info) {
    if (err) {
      console.log(err);
    } else {
      var access_code = req.query['access_code'];
      if (!info.enable_access_code ||
          access_code == info.access_code) {
        renderHomepage(req, res, info);
      } else if (access_code == null) {
  logRequest(req, 'Render access page');
        var poem = poems[Math.floor(Math.random()*poems.length)];
        res.render('access.ejs',
                   {info: info, poem: poem, header: header, title: title});
      } else {
  logRequest(req, 'Wrong access code: ' + access_code);
        req.flash('error', '验证码不正确');
        res.redirect('/');
      }
    }
  });
});

function renderHomepage(req, res, info) {
  Profile.find({}, function(err, profiles) {
    if (err) {
      console.log(err);
    } else {
      logRequest(req, 'Render home page');
      var poem = poems[Math.floor(Math.random()*poems.length)];
      res.render('index.ejs',
                 {profiles: profiles, info: info, poem: poem,
                  header: header, title: title});
    }
  });
  // update stat
  updateStat(req);
}

async function updateStat(req) {
  var today = moment.tz('America/Los_Angeles').format('YYYY/MM/DD UTC');
  Stat.findOne({}, function(err, stat) {
    if (err) {
      console.log(err);
    } else {
      value = stat.homepage.get(today);
      if (!value) {
        stat.homepage.set(today, 1);
      } else {
        stat.homepage.set(today, value+1);
      }
      var city = getCity(req);
      if (city) {
  stat.cities.push(city);
  while (stat.cities.length > 1000) {
    stat.cities.shift();
  }
      }
      stat.save();
    }
  });
}

// admin page
app.get('/admin', isLoggedIn, function(req, res, err) {
  Profile.find({}, function(err, profiles) {
    if (err) {
      console.log(err);
    } else {
      Info.findOne({}, function(err, info) {
        if (err) {
          console.log(err);
        } else {
          Stat.findOne({}, function(err, stat) {
            if (err) {
              console.log(err);
            } else {
              var current = moment.tz('America/Los_Angeles').add(1, 'day');
              var visit = new Map();
              for(var i = 0; i < 365; i++) {
                var key = current.add(-1, 'day').format('YYYY/MM/DD UTC');
                var value = stat.homepage.get(key);
                if (value) {
                  visit.set(key, value);
                }
              }
        var cities = new Map();
        for(var i = 0; i < stat.cities.length; i++) {
    var city = stat.cities[i];
    var value = cities.get(city)
    if (!value) {
      cities.set(city, 1);
    } else {
      cities.set(city, value+1);
    }
        }
        var cityData = new Array();
        cities.forEach(function(data, label) {
    cityData.push({'label': label, 'data': data});
        });
        cityData.sort(function(a, b) {return b.data - a.data});
        for (var i = 0; i < cityData.length; i++) {
    cityData[i].color = pieColors[i % pieColors.length];
        }
              res.render('admin.ejs',
                         {profiles: profiles, info: info, visit: visit,
                          title: title, cityData: cityData});
            }
          });
        }
      });
    }
  });
});

// edit info GET form
app.get('/info_update', isLoggedIn, function(req, res) {
  Info.findOne({}, function(err, info) {
    if (err) {
      console.log(err);
    } else {
      res.render('info_update.ejs', {info: info, title: title});
    }
  });
});

// update info PUT route
app.put('/info_update', isLoggedIn, function(req, res) {
  Info.findOne({}, function(err, info) {
    req.body.info.show_notice = Boolean(req.body.info.show_notice);
    req.body.info.allow_like = Boolean(req.body.info.allow_like);
    req.body.info.allow_dislike = Boolean(req.body.info.allow_dislike);
    req.body.info.enable_access_code = Boolean(req.body.info.enable_access_code);
    req.body.info.enable_lastday = Boolean(req.body.info.enable_lastday);
    info.update(req.body.info, function(err, updated_info) {
      if (err) {
        console.log(err);
      }
    });
    res.redirect('/admin');
  });
});

// create NEW profile GET form
app.get('/new', isLoggedIn, function(req, res) {
  Info.findOne({}, function(err, info) {
    if (err) {
      console.log(err);
    } else {
      res.render('new.ejs', {title: title, info: info});
    }
  });
});

// create NEW profile post route
app.post('/new', isLoggedIn, function(req, res) {
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
  Profile.create(req.body.profile, function(err) {
    if (err) {
      console.log(err);
    } else {
      res.redirect('admin');
    };
  });
});

// upload file route
// ref: https://coligo.io/building-ajax-file-uploader-with-node/
app.post('/upload_image', isLoggedIn, function(req, res) {
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
    var filesize = fs.statSync(filepath).size;
    var quality = Math.min(Math.round(2000000 / filesize) * 10, 100);
    var date_str = new Date().toISOString().replace(/\T.+/, '').replace(/-/g, '');
    cloudinary.uploader.upload(
      filepath,
      {quality: quality,
       fetch_format: "auto",
       folder: process.env.CLOUDINARY_FOLDER + '/' + date_str},
      function(error, result) {
        if (error) {
          console.log(error);
        }
        res.send(result.secure_url);
        fs.unlink(filepath, (err) => {
          if (err) {
            console.log(err);
          }
        });
      }
    );
  });

  // parse the incoming request containing the form data
  form.parse(req);
});

app.post('/upload_video', isLoggedIn, function(req, res) {
  // create an incoming form object
  var form = new formidable.IncomingForm();

  // specify that we want to allow the user to upload multiple files in a single request
  form.multiples = false;

  // store all uploads in the /uploads directory
  form.uploadDir = './uploads'

  if (!fs.existsSync(form.uploadDir)) {
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

// [Deprecated] Create file in Google Drive
async function createFile(auth, filename, filepath, res) {
  const filesize = fs.statSync(filepath).size;
  const drive = google.drive({version: 'v3', auth});
  const google_res = await drive.files.create({
    requestBody: {
      name: filename,
      parents: [process.env.DRIVE_DIR]
    },
    media: {
      body: fs.createReadStream(filepath)
    }
  });
  res.send('https://drive.google.com/uc?id='+google_res.data.id)
  fs.unlink(filepath, (err) => {
    if (err) {
      console.log(err);
    }
  });
}


async function createVideo(auth, filename, filepath, res) {
  const filesize = fs.statSync(filepath).size;
  const youtube = google.youtube({version: 'v3', auth});
  const google_res = await youtube.videos.insert({
    part: 'id,snippet,status',
    notifySubscribers: false,
    requestBody: {
      snippet: {
        title: process.env.USERNAME + '-video',
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
    if (err) {
      console.log(err);
    }
  });
}

// edit profile GET form
app.get('/edit/:id', isLoggedIn, function(req, res) {
  Profile.findById(req.params.id, function(err, profile) {
    if (err) {
      console.log(err);
    } else {
      Info.findOne({}, function(err, info) {
        if (err) {
          console.log(err);
        } else {
          res.render('edit.ejs', {profile: profile, title: title, info: info});
        }
      });
    }
  });
});

// update profile PUT route
app.put('/:id', isLoggedIn, function(req, res) {
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
  Profile.findById(req.params.id, function(err, profile) {
    if (err) {
      console.log(err);
    } else {
      var name = profile.name;
      if (req.body.profile.name != name) {
        req.body.profile.likes = 0;
        req.body.profile.dislikes = 0;
      }
      Profile.findByIdAndUpdate(req.params.id, req.body.profile, function(err, updated_profile) {
        if (err) {
          console.log(err);
        } else {
          res.redirect('/admin#' + String(req.params.id));
        }
      });
    }
  });
});

// update profile likes or dislikes
app.put('/:id/thumbs/:action', function(req, res) {
  Profile.findById(req.params.id, function(err, profile) {
    if (err) {
      console.log(err);
    } else {
      if (req.params.action == 'like') {
        profile.likes++;
      }
      if (req.params.action == 'dislike') {
        profile.dislikes++;
      }
      Profile.findByIdAndUpdate(req.params.id, profile, function(err, updated_profile) {
        if (err) {
          console.log(err);
        }
      });
    }
  });
  res.send(null);
});

// destroy profile DELETE route
app.delete('/:id', isLoggedIn, function(req, res) {
  Profile.findByIdAndRemove(req.params.id, function(err) {
    if (err) {
      console.log(err);
    } else {
      res.redirect('/admin');
    }
  });
});

// show login form
app.get('/login', function(req, res) {
  if (req.isAuthenticated()) {
    res.redirect('/admin');
  } else {
    res.render('login.ejs', {title: title});
  }
});

// handling login logic
app.post('/login', passport.authenticate('local',
                                         {
                                           successRedirect: '/admin',
                                           failureRedirect: '/login',
                                           failureFlash: '用户名或密码不正确'
                                         }), function(req, res) {});

// logout route
app.get('/logout', function(req, res) {
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
