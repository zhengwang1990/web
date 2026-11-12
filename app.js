var express        = require('express'),
    app            = express(),
    mongoose       = require('mongoose'),
    cookieParser   = require('cookie-parser'),
    methodOverride = require('method-override'),
    path           = require('path'),
    {formidable}   = require('formidable'),
    fs             = require('fs'),
    passport       = require('passport'),
    LocalStrategy  = require('passport-local'),
    session        = require('express-session'),
    moment         = require('moment-timezone'),
    {google}       = require('googleapis'),
    geoip          = require('geoip-lite'),
    cloudinary     = require('cloudinary').v2,
    ImageKit       = require('@imagekit/nodejs').default;

// seed & init
var seedDB = require('./seeds');
var initDB = require('./init');

// database
var Profile = require('./models/profile'),
    Info    = require('./models/info'),
    User    = require('./models/user'),
    Stat    = require('./models/stat');

mongoose.connect(process.env.MONGODB).catch(err => console.log(err));

var pieColors = ['#77b7c5', '#81B2AC', '#b184e8', '#e07f67', '#549abf',
     '#798584', '#cf8091', '#c474c0', '#ff8811'];

app.use(express.urlencoded({extended: true}));
app.use(methodOverride('_method'));
app.use(express.static('public'));
// flash messages stored in the session (replaces the unmaintained connect-flash)
app.use(function(req, res, next) {
  req.flash = function(type, msg) {
    var msgs = req.session.flash = req.session.flash || {};
    if (type && msg) {
      return (msgs[type] = msgs[type] || []).push(...[].concat(msg));
    }
    if (type) {
      var arr = msgs[type] || [];
      delete msgs[type];
      return arr;
    }
    req.session.flash = {};
    return msgs;
  };
  next();
});
app.use(cookieParser());

// passport configuration
app.use(session({
  secret: 'Any text which makes a secret',
  resave: false,
  saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());
app.use(express.json());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

// Image kit
var imagekit = new ImageKit({
    privateKey : process.env.IMAGEKIT_PRIVATE_KEY
});
cleanup_imagekit_folders();

//seedDB();
initDB().catch(err => console.log(err));

app.use(function(req, res, next) {
  res.locals.currentUser = req.user;
  res.locals.success = req.flash('success');
  res.locals.error = req.flash('error');
  next();
});

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
const ref_access_cookie = 'c%3ZX$CYeBA*ecxdldi@poGYojvgdf'

geoip.startWatchingDataUpdate();

// Behind proxies (Cloudflare, Coolify's Traefik), X-Forwarded-For is
// "client, proxy1, proxy2", so the visitor is the first entry, not the last.
function getIp(req) {
  return req.headers['cf-connecting-ip'] ||
         (req.headers['x-forwarded-for'] || '').split(',')[0].trim() ||
         req.socket.remoteAddress;
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
app.get('/', async function(req, res) {
  logRequest(req, 'GET / is requested');
  var info = await Info.findOne({});
  var access_cookie = req.cookies['access'];
  if (!info.enable_access_code ||
      access_cookie == ref_access_cookie) {
    await renderHomePage(req, res, info);
  } else {
    if (access_cookie != null) {
      res.clearCookie('access');
    }
    renderAccessPage(req, res, info);
  }
});

app.post('/access', async function(req, res) {
  var info = await Info.findOne({});
  var access_code = req.body.access_code;
  if (access_code == info.access_code) {
    res.cookie('access', ref_access_cookie, {maxAge: 21600000});
  } else {
    req.flash('error', '验证码不正确');
  }
  res.redirect('/');
});

function renderAccessPage(req, res, info) {
  logRequest(req, 'Render access page');
  var poem = poems[Math.floor(Math.random()*poems.length)];
  res.render('access.ejs',
             {info: info, poem: poem, header: header, title: title});
}

async function renderHomePage(req, res, info) {
  // update stat
  updateStat(req).catch(err => console.log(err));
  var profiles = await Profile.find({});
  logRequest(req, 'Render home page');
  var poem = poems[Math.floor(Math.random()*poems.length)];
  res.render('index.ejs',
             {profiles: profiles, info: info, poem: poem,
              header: header, title: title});
}

async function updateStat(req) {
  var today = moment.tz('America/Los_Angeles').format('YYYY/MM/DD UTC');
  var stat = await Stat.findOne({});
  var value = stat.homepage.get(today);
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
  await stat.save();
}

// admin page
app.get('/admin', isLoggedIn, async function(req, res) {
  var profiles = await Profile.find({});
  var info = await Info.findOne({});
  var stat = await Stat.findOne({});
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
});

// edit info GET form
app.get('/info_update', isLoggedIn, async function(req, res) {
  var info = await Info.findOne({});
  res.render('info_update.ejs', {info: info, title: title});
});

// update info PUT route
app.put('/info_update', isLoggedIn, async function(req, res) {
  var info = await Info.findOne({});
  req.body.info.show_notice = Boolean(req.body.info.show_notice);
  req.body.info.allow_like = Boolean(req.body.info.allow_like);
  req.body.info.allow_dislike = Boolean(req.body.info.allow_dislike);
  req.body.info.enable_access_code = Boolean(req.body.info.enable_access_code);
  req.body.info.enable_lastday = Boolean(req.body.info.enable_lastday);
  try {
    await info.updateOne(req.body.info);
  } catch (err) {
    console.log(err);
  }
  res.redirect('/admin');
});

// create NEW profile GET form
app.get('/new', isLoggedIn, async function(req, res) {
  var info = await Info.findOne({});
  res.render('new.ejs', {title: title, info: info});
});

// create NEW profile post route
app.post('/new', isLoggedIn, async function(req, res) {
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
  await Profile.create(req.body.profile);
  res.redirect('admin');
});


const UPLOAD_DIR = './uploads';

function upload_to_cloudinary(res, form, format) {
  form.on('file', function(field, file) {
    var filepath = path.join(UPLOAD_DIR, path.basename(file.originalFilename));
    fs.rename(file.filepath, filepath, (err) => {
      if (err) throw err;
      const filesize = fs.statSync(filepath).size;
      var date_str = new Date().toISOString().replace(/\T.+/, '').replace(/-/g, '');
      console.log('Uploading ' + filepath + ' to cloudinary');
      cloudinary.uploader.upload(
        filepath,
        {
          resource_type: format == 'jpg' ? 'image' : 'video',
          quality: 'auto:good',
          fetch_format: 'auto',
          format: format,
          folder: process.env.MEDIA_FOLDER + '/' + date_str
        },
        function(error, result) {
          if (error) {
            console.log(error);
            res.send(error.message);
          } else {
            res.send(result.secure_url);
          }
          fs.unlink(filepath, (err) => {
            if (err) {
              console.log(err);
            }
          });
        }
      );
    });
  });
}

function upload_to_imagekit(res, form, format) {
  form.on('file', function(field, file) {
    var filepath = path.join(UPLOAD_DIR, path.basename(file.originalFilename));
    fs.rename(file.filepath, filepath, (err) => {
      if (err) throw err;
      var date_str = new Date().toISOString().replace(/\T.+/, '').replace(/-/g, '');
      const filename = path.basename(filepath);
      const tags = [date_str];
      console.log('Uploading ' + filepath + ' to imagekit');
      imagekit.files.upload({
        file: fs.createReadStream(filepath),
        fileName: filename,
        tags: tags,
        folder: process.env.MEDIA_FOLDER + '/' + date_str,
        isPublished: true,
      }).then(result => {
        res.send(result.url + '?fileId=' + result.fileId);
      }).catch(error => {
        console.log(error);
        res.send(error.message);
      }).finally(() => {
        fs.unlink(filepath, (err) => {
          if (err) {
            console.log(err);
          }
        });
      });
    });
  });
}

// upload file route
// ref: https://coligo.io/building-ajax-file-uploader-with-node/
app.post('/upload_image', isLoggedIn, function(req, res) {
  // create an incoming form object
  // single file per request, stored in the /uploads directory
  var form = formidable({uploadDir: UPLOAD_DIR, maxFiles: 1});

  // every time a file has been uploaded successfully
  if (process.env.IMAGE_PROVIDER.toUpperCase() == "IMAGEKIT") {
    upload_to_imagekit(res, form, 'jpg');
  } else {
    upload_to_cloudinary(res, form, 'jpg');
  }

  // parse the incoming request containing the form data
  form.parse(req).catch(err => {
    console.log(err);
    if (!res.headersSent) res.status(400).send(err.message);
  });
});

app.post('/upload_video', isLoggedIn, function(req, res) {
  // create an incoming form object
  // single file per request, stored in the /uploads directory
  var form = formidable({uploadDir: UPLOAD_DIR, maxFiles: 1});

  // every time a file has been uploaded successfully
  if (process.env.VIDEO_PROVIDER.toUpperCase() == "IMAGEKIT") {
    upload_to_imagekit(res, form, 'mp4');
  } else {
    upload_to_cloudinary(res, form, 'mp4');
  }

  // parse the incoming request containing the form data
  form.parse(req).catch(err => {
    console.log(err);
    if (!res.headersSent) res.status(400).send(err.message);
  });
});

app.post('/delete_asset', isLoggedIn, function(req, res) {
  delete_asset(req.body.url, req.body.type);
  res.sendStatus(204);
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


// [Deprecated] Upload video to Youtube
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
app.get('/edit/:id', isLoggedIn, async function(req, res) {
  var profile = await Profile.findById(req.params.id);
  var info = await Info.findOne({});
  res.render('edit.ejs', {profile: profile, title: title, info: info});
});

function delete_asset(url, resource_type) {
  if (url.includes('imagekit')) {
    delete_imagekit_asset(url, resource_type);
  } else {
    delete_cloudinary_asset(url, resource_type);
  }
}

function delete_cloudinary_asset(url, resource_type) {
  var pos = url.indexOf(process.env.MEDIA_FOLDER);
  var public_id = url.substring(pos).split('.').slice(0, -1).join('.');
  console.log('Deleting ' + public_id + ', resource type ' + resource_type);
  cloudinary.uploader.destroy(public_id, {resource_type: resource_type}).then(result => console.log(result)).catch(error => console.error('Error', error));
}

function delete_imagekit_asset(url, resource_type) {
  var fields = url.split('?fileId=');
  if (fields.length > 1) {
    var fileId = fields[1];
    var fileName = fields[0].split('/').slice(-3).join('/');
    console.log(`Deleting ${fileName} with ID ${fileId}`);
    imagekit.files.delete(fileId).then(result => console.log(`Deleted ${fileName}`)).catch(error => console.error('Error:', error));
  }
}

async function cleanup_imagekit_folders() {
  var date_str = new Date().toISOString().replace(/\T.+/, '').replace(/-/g, '');
  imagekit.assets.list({
    'path': process.env.MEDIA_FOLDER,
    'fileType': 'all',
    'type': 'folder',
  }).then(results => {
    results.forEach(result => {
      if (result.name == date_str) {
        // Do not delete today's folder in case an uploading is running
        return;
      }
      var folder_name = process.env.MEDIA_FOLDER + '/' + result.name;
      imagekit.assets.list({
        'path': folder_name,
        'fileType': 'all',
        'type': 'all',
      }).then(files => {
        if (files.length === 0) {
          imagekit.folders.delete({folderPath: folder_name})
            .then(result => console.log(`Folder ${folder_name} deleted`))
            .catch(error => console.error(`Error deleting ${folder_name}`, error));
        } else {
          console.log(`Folder ${folder_name} has ${files.length} files`)
        }
      }).catch(error => console.error(`Error listing ${folder_name}`, error));
    });
  }).catch(error => console.error(`Error listing ${process.env.MEDIA_FOLDER}`, error));
}

// update profile PUT route
app.put('/:id', isLoggedIn, async function(req, res) {
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
  var profile = await Profile.findById(req.params.id);
  var name = profile.name;
  if (req.body.profile.name != name) {
    req.body.profile.likes = 0;
    req.body.profile.dislikes = 0;
  }
  profile.images.forEach((image) => {
    if (!req.body.profile.images.includes(image)) {
      delete_asset(image, 'image');
    }
  });
  profile.videos.forEach((video) => {
    if (!req.body.profile.videos.includes(video)) {
      delete_asset(video, 'video');
    }
  });
  await Profile.findByIdAndUpdate(req.params.id, req.body.profile);
  res.redirect('/admin#' + String(req.params.id));
});

// update profile likes or dislikes
app.put('/:id/thumbs/:action', function(req, res) {
  var inc = {};
  if (req.params.action == 'like') {
    inc.likes = 1;
  }
  if (req.params.action == 'dislike') {
    inc.dislikes = 1;
  }
  if (Object.keys(inc).length > 0) {
    Profile.findByIdAndUpdate(req.params.id, {$inc: inc})
      .catch(err => console.log(err));
  }
  res.send(null);
});

// destroy profile DELETE route
app.delete('/:id', isLoggedIn, async function(req, res) {
  var profile = await Profile.findByIdAndDelete(req.params.id);
  if (profile) {
    profile.images.forEach((image) => delete_asset(image, 'image'));
    profile.videos.forEach((video) => delete_asset(video, 'video'));
  }
  res.redirect('/admin');
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
  req.logout(err => {
    if (err) {
      console.log(err);
    }
    req.flash('success', '你已经退出登录');
    res.redirect('/');
  });
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
