// =================== [ Images ]==============================================
$("#image_row").on("click", "button", function(){
    let url = $(this).closest(".image_col").find("img").attr("src");
    fetch("/delete_asset", {
        method: 'POST',
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({url: url, type: "image"})
    });
    $(this).parent().parent().remove();
});

$(".upload-image-btn").on("click", function (){
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
    $("#video_row source").each(function(){
        videos.push($(this).attr("src"));
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
    var files = $(this).get(0).files;

    if (files.length > 0){
        // create a FormData object which will be sent as the data payload in the
        //  AJAX request
        var formData = new FormData();

        // loop through all the selected files and add them to the formData object
        for (var i = 0; i < files.length; i++) {
            var file = files[i];

            file_size_mb = file.size / 1024 / 1024;
            if (file_size_mb > 10) {
                alert("图片大小不可以超过10M");
                return;
            }

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
                        percentComplete = parseInt(percentComplete * 50);

                        // update the Bootstrap progress bar with the new percentage
                        $("#image-progress-bar").text(percentComplete + "%");
                        $("#image-progress-bar").width(percentComplete + "%");
                    }
                }, false);
                return xhr;
            }
        });
    }
});

function reloadimage(data){
    if (!data.startsWith("http")) {
        alert("错误: " + data);
        return;
    }
    $("#image-progress-bar").text("0%");
    $("#image-progress-bar").width("0%");
    $("#image_row").append('<div class="col-lg-6 col-md-12 image_col">\n' +
                           '<p> <img src="' + data + '" class="img-thumbnail"> </p>\n'+
                           '<p style="margin-top:10px"> <button class="btn btn-danger btn-lg" type="button">删除</button> </p> </div>');
    $("#upload-image-input").val(null);
}

// =================== [ Videos ]==============================================
$("#video_row").on("click", "button", function(){
    let url = $(this).closest(".video_col").find("source").attr("src");
    fetch("/delete_asset", {
        method: 'POST',
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({url: url, type: "video"})
    });
    $(this).parent().parent().remove();
});

$(".upload-video-btn").on("click", function (){
    $("#upload-video-input").click();
    $("#video-progress-bar").text("0%");
    $("#video-progress-bar").width("0%");
});

$("#upload-video-input").on("change", function(){
    var files = $(this).get(0).files;

    if (files.length > 0){
        // create a FormData object which will be sent as the data payload in the
        // AJAX request
        var formData = new FormData();

        // loop through all the selected files and add them to the formData object
        for (var i = 0; i < files.length; i++) {
            var file = files[i];

            file_size_mb = file.size / 1024 / 1024;
            if (file_size_mb > 100) {
                alert("视频大小不可以超过100M");
                return;
            }

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
                        percentComplete = parseInt(percentComplete * 50);

                        // update the Bootstrap progress bar with the new percentage
                        $("#video-progress-bar").text(percentComplete + "%");
                        $("#video-progress-bar").width(percentComplete + "%");
                    }
                }, false);

                return xhr;
            }
        });

    }
});

function reloadvideo(data){
    if (!data.startsWith("http")) {
        alert("错误: " + data);
        return;
    }
    $("#video-progress-bar").text("0%");
    $("#video-progress-bar").width("0%");
    $("#video_row").append('<div class="col-lg-12 video_col">\n' +
                           '<div class="ratio-container">\n' +
                           '<video width="100%" controls><source src="' + data + '" type="video/mp4"></video>\n' +
                           '</div> <p style="margin-top:10px"> <button class="btn btn-danger btn-lg" type="button">删除</button> </p> </div>');
    $("#upload-video-input").val(null);
}

$("#sandbox-container .input-group").datepicker({
    maxViewMode: 1,
    language: "zh-CN",
    autoclose: true,
    todayHighlight: true,
    startDate: "yesterday"
});

var nextdateUpdated = false;
var nameChangeCount = 0;
$("#name").on("input", function(){
    nameChangeCount++;
    if (!nextdateUpdated && nameChangeCount >= 4) {
        var today = new Date();
        var nextday = Math.round(today.getDate()/10 - 0.2) * 10 + 10;
        if (nextday <= 20) {
            var nextdate = new Date(today.getFullYear(), today.getMonth(), nextday);
        } else if (nextday <= 30) {
            var nextdate = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        } else {
            var nextdate = new Date(today.getFullYear(), today.getMonth() + 1, 10);
        }
        var dd = String(nextdate.getDate()).padStart(2, '0');
        var mm = String(nextdate.getMonth() + 1).padStart(2, '0');
        var yyyy =  nextdate.getFullYear();
        nextdate = yyyy + '-' + mm + '-' + dd;
        $("#lastday").val(nextdate);
        $("#sandbox-container .input-group").datepicker("update");
        nextdateUpdated = true;
    }
});

$("#lastday").on("change", function(){
    nextdateUpdated = true;
});
