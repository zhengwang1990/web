var Profile = require("./models/profile");
var data = [
    {
        name: "Pikachu", 
        description: "Pikachu are a species of Pokémon, fictional creatures that appear in an assortment of video games, animated television shows and movies, trading card games, and comic books licensed by The Pokémon Company, a Japanese corporation.",
        images: [
        	"https://i.pinimg.com/736x/76/47/9d/76479dd91dc55c2768ddccfc30a4fbf5--pikachu-halloween-costume-diy-halloween-costumes.jpg",
        	"https://static.zerochan.net/Pikachu.full.1659646.jpg",
        	"https://images.moviepilot.com/images/c_fill,h_380,w_500/t_mp_quality_gif/c6z4drjwxxxy2dmgkigh/did-pikachu-have-an-owner-before-ash-this-fan-theory-just-might-explain-this-pokemon-s-or-945711.jpg",
        	"https://pokemongohub.net/wp-content/uploads/2016/09/pokemon-go-pikachu-guide.jpg"
    	]
    },
    {
        name: "Wall-E", 
        description: "WALL-E, short for Waste Allocation Load Lifter Earth-class, is the last robot left on Earth. He spends his days tidying up the planet, one piece of garbage at a time.",
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


function seedDB(){
	Profile.remove({}, function(err){
        if (err) {
            console.log(err);
        } else {
        	addData();
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

module.exports = seedDB;
