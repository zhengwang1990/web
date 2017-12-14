$("#photo_row").on("click", "button", function(){
	$(this).parent().parent().remove();
});

$(".upload-btn").on("click", function (){
    $("#upload-input").click();
    $(".progress-bar").text("0%");
    $(".progress-bar").width("0%");
});

$("form").submit(function() {
	var images = [];
	$("#photo_row img").each(function(){
		images.push($(this).attr("src"));
	});
	var str_img = "";
	images.forEach(function(image){
		str_img += image;
		str_img += ";";
	});
	$("#images").val(str_img.slice(0,-1));
    return true;
});

$("#upload-input").on("change", function(){

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
      url: "/upload",
      type: "POST",
      data: formData,
      processData: false,
      contentType: false,
      success: reloadpage,
      xhr: function() {
        // create an XMLHttpRequest
        var xhr = new XMLHttpRequest();

        // listen to the "progress" event
        xhr.upload.addEventListener("progress", function(evt) {

          if (evt.lengthComputable) {
            // calculate the percentage of upload completed
            var percentComplete = evt.loaded / evt.total;
            percentComplete = parseInt(percentComplete * 100);

            // update the Bootstrap progress bar with the new percentage
            $(".progress-bar").text(percentComplete + "%");
            $(".progress-bar").width(percentComplete + "%");
          }
        }, false);

        return xhr;
      }
    });

  }
});

function reloadpage(data){
	$(".progress-bar").text("0%");
    $(".progress-bar").width("0%");
    $("#photo_row").append('<div class="col-lg-4 col-md-6 col-sm-12">\n' +
                           '<p> <img src="' + data + '" class="img-thumbnail"> </p> \n'+
                           '<p> <button class="btn btn-danger btn-sm" type="button">删除</button> </p> </div>');
}