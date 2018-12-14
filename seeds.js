var Profile = require("./models/profile"),
    Info    = require("./models/info"),
    User    = require("./models/user");

var data = [
  {
    name: "皮卡丘",
    description: "日本任天堂公司开发的掌机游戏系列《精灵宝可梦》和根据它改编的动画中登场的虚构角色神奇宝贝中的一种。皮卡丘被选为2014年巴西世界杯日本官方吉祥物。",
    images: [
      "https://i.pinimg.com/736x/76/47/9d/76479dd91dc55c2768ddccfc30a4fbf5--pikachu-halloween-costume-diy-halloween-costumes.jpg",
      "https://static.zerochan.net/Pikachu.full.1659646.jpg",
      "https://images.moviepilot.com/images/c_fill,h_380,w_500/t_mp_quality_gif/c6z4drjwxxxy2dmgkigh/did-pikachu-have-an-owner-before-ash-this-fan-theory-just-might-explain-this-pokemon-s-or-945711.jpg",
      "https://pokemongohub.net/wp-content/uploads/2016/09/pokemon-go-pikachu-guide.jpg"
    ]
  },
  {
    name: "瓦力",
    description: "《机器人瓦力》（英语：WALL-E）是2008年一部由皮克斯动画工作室制作、华特迪士尼视频出版的计算机动画科幻电影，由安德鲁·史丹顿编导。故事描述地球上的清扫型机器人瓦力爱上了女机器人伊芙后，跟随她进入太空历险的故事。",
    images: [
      "https://dp1eoqdp1qht7.cloudfront.net/community/migrated/ab0/d3d/346938/image",
      "https://vignette.wikia.nocookie.net/pixar/images/c/ce/Wall-E_Cubecolors.jpg/revision/latest?cb=20090615011459",
      "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQJuTPbABbGGMWEnkTjC-9IHFtTpNnyeanMcuJUEMUoPWOsBAeQ",
      "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTL0hJjEq6Oi5W6KaJHe2eZA6Z42Ji1q7OSidxhKdoY0BndyYuD",
      "https://vignette.wikia.nocookie.net/pixar/images/7/7e/Wall-E_City1.jpg/revision/latest?cb=20090615011754"
    ]
  },
  {
    name: "哪吒",
    description: "中国古代神话传说人物，道教护法神。哪吒信仰兴盛于道教与民间信仰。在道教的头衔为中坛元帅、通天太师、威灵显赫大将军、三坛海会大神等，俗称太子爷、三太子。",
    images: [
      "http://p3.pstatp.com/large/2c3a0000552e593f3c7a",
      "http://www.twword.com/uploads/wiki/83/9a/289_11.jpg",
      "http://imgtu.lishiquwen.com/20170119/83f797ae237576f8005c254f6f610fed.jpg"
    ]
  },
];

var info_data = {
  wechat: "weixin12345",
  phone: "123456789",
  notice: "江南皮革厂倒闭了。老板带着小姨子跑了。现在全部大甩卖。",
  show_notice: true
};

function seedDB(){
  Profile.remove({}, function(err){
    if (err) {
      console.log(err);
    } else {
      addData();
    }
  });
  Info.remove({}, function(err){
    if (err) {
      console.log(err);
    } else {
      addInfo();
    }
  });
  User.remove({}, function(err){
     if (err) {
       console.log(err);
     } else {
       addUser();
     }
  });
}

function addData(){
  data.forEach(function(seed){
    Profile.create(seed, function(err, profile){
      if (err) {
        console.log(err);
      }
    });
  });
}

function addInfo(){
  Info.create(info_data, function(err, info){
    if (err){
      console.log(err);
    }
  });
}

function addUser(){
  var newUser = new User({username: "lili"});
  User.register(newUser, "12345", function(err, user){
    if(err){
      console.log(err);
    }
  });
}

module.exports = seedDB;
