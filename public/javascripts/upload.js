function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// =================== [ Images ]==============================================
var uploading_image = false;

$("#image_row").on("click", "button", function(){
    $(this).parent().parent().remove();
});

$(".upload-image-btn").on("click", function (){
    if (uploading_image) {return;}
    $("#upload-image-input").click();
    $("#image-progress-bar").text("0%");
    $("#image-progress-bar").width("0%");
});

$("form").submit(function() {
    var images = [];
    $("#image_row img").each(function(){
	images.push($(this).attr("src"));
    });
    var str_img = "";
    images.forEach(function(image){
	str_img += image;
	str_img += ";";
    });
    $("#images").val(str_img.slice(0,-1));

    var videos = [];
    $("#video_row iframe").each(function(){
	videos.push($(this).attr("src").split('?')[0]);
    });
    var str_video = "";
    videos.forEach(function(video){
	str_video += video;
	str_video += ";";
    });
    $("#videos").val(str_video.slice(0,-1));

    return true;
});

$("#upload-image-input").on("change", function(){

    uploading_image = true;
    
    var files = $(this).get(0).files;

    if (files.length > 0){
	// create a FormData object which will be sent as the data payload in the
	// AJAX request
	var formData = new FormData();

	// loop through all the selected files and add them to the formData object
	for (var i = 0; i < files.length; i++) {
	    var file = files[i];

	    // add the files to formData object for the data payload
	    formData.append("uploads[]", file, file.name);
	}

	$.ajax({
	    url: "/upload_image",
	    type: "POST",
	    data: formData,
	    processData: false,
	    contentType: false,
	    success: reloadimage,
	    xhr: function() {
		// create an XMLHttpRequest
		var xhr = new XMLHttpRequest();

		// listen to the "progress" event
		xhr.upload.addEventListener("progress", async function(evt) {

		    if (evt.lengthComputable) {
			// calculate the percentage of upload completed
			var percentComplete = evt.loaded / evt.total;
			percentComplete = parseInt(percentComplete * 45);

			// update the Bootstrap progress bar with the new percentage
			$("#image-progress-bar").text(percentComplete + "%");
			$("#image-progress-bar").width(percentComplete + "%");
		    }
		    while (uploading_image) {
			await sleep(1000);
			var xmlHttp = new XMLHttpRequest();
			xmlHttp.onreadystatechange = function() {
			    if (this.readyState == 4 && this.status == 200) {
				if (uploading_image) {
				    percentComplete = 45 + Math.round(parseFloat(this.responseText)*0.45);
				    $("#image-progress-bar").text(percentComplete + "%");
				    $("#image-progress-bar").width(percentComplete + "%");
				}
			    }
			};
			xmlHttp.open("GET", '/file_progress?filename='+file.name, true);
			xmlHttp.send(null);			
		    }
		    
		}, false);
		return xhr;
	    }
	});

    }
});

function reloadimage(data){
    uploading_image = false;
    $("#image-progress-bar").text("0%");
    $("#image-progress-bar").width("0%");
    $("#image_row").append('<div class="col-lg-6 col-md-12">\n' +
                           '<p> <img src="' + data + '" class="img-thumbnail"> </p>\n'+
			   '<p style="margin-top:10px"> <button class="btn btn-danger btn-lg" type="button">删除</button> </p> </div>');
}

// =================== [ Videos ]==============================================
var uploading_video = false;

$("#video_row").on("click", "button", function(){
    $(this).parent().parent().remove();
});

$(".upload-video-btn").on("click", function (){
    if (uploading_video) {return;}
    $("#upload-video-input").click();
    $("#video-progress-bar").text("0%");
    $("#video-progress-bar").width("0%");
});

$("#upload-video-input").on("change", function(){

    uploading_video = true;
    
    var files = $(this).get(0).files;

    if (files.length > 0){
	// create a FormData object which will be sent as the data payload in the
	// AJAX request
	var formData = new FormData();

	// loop through all the selected files and add them to the formData object
	for (var i = 0; i < files.length; i++) {
	    var file = files[i];

	    // add the files to formData object for the data payload
	    formData.append("uploads[]", file, file.name);
	}

	$.ajax({
	    url: "/upload_video",
	    type: "POST",
	    data: formData,
	    processData: false,
	    contentType: false,
	    success: reloadvideo,
	    xhr: function() {
		// create an XMLHttpRequest
		var xhr = new XMLHttpRequest();

		// listen to the "progress" event
		xhr.upload.addEventListener("progress", async function(evt) {

		    if (evt.lengthComputable) {
			// calculate the percentage of upload completed
			var percentComplete = evt.loaded / evt.total;
			percentComplete = parseInt(percentComplete * 45);

			// update the Bootstrap progress bar with the new percentage
			$("#video-progress-bar").text(percentComplete + "%");
			$("#video-progress-bar").width(percentComplete + "%");
		    }

		    while (uploading_video) {
			await sleep(1000);
			var xmlHttp = new XMLHttpRequest();
			xmlHttp.onreadystatechange = function() {
			    if (this.readyState == 4 && this.status == 200) {
				if (uploading_video) {
				    percentComplete = 45 + Math.round(parseFloat(this.responseText)*0.45);
				    $("#video-progress-bar").text(percentComplete + "%");
				    $("#video-progress-bar").width(percentComplete + "%");
				}
			    }
			};
			xmlHttp.open("GET", '/file_progress?filename='+file.name, true);
			xmlHttp.send(null);			
		    }

		}, false);

		return xhr;
	    }
	});

    }
});

function reloadvideo(data){
    uploading_video = false
    $("#video-progress-bar").text("0%");
    $("#video-progress-bar").width("0%");
    $("#video_row").append('<div class="col-lg-12">\n' +
			   '<div class="ratio-container">\n' +
			   '<iframe class="video-frame" src="' + data + '?rel=0&amp;showinfo=0" frameborder="0" allow="autoplay; encrypted-media" allowfullscreen></iframe>\n' +
			   '</div> <p style="margin-top:10px"> <button class="btn btn-danger btn-lg" type="button">删除</button> </p> </div>');
}
