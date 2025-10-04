// =================== [ Images ]==============================================
var existing_images = new Set();
$("#image_row img").each(function(){
    existing_images.add($(this).attr("src"));
});

$("#image_row").on("click", "button", function(){
    let url = $(this).closest(".image_col").find("img").attr("src");
    if (!existing_images.has(url)) {
        fetch("/delete_asset", {
            method: 'POST',
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({url: url, type: "image"})
        });
    }
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
    let file_size_mb = 10;

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

        let progressInterval;
        var uploadCompleteSize = 60;
        if (file_size_mb < 1) {
            uploadCompleteSize = 70;
        }

        $.ajax({
            url: "/upload_image",
            type: "POST",
            data: formData,
            processData: false,
            contentType: false,
            success: function(data) {
                clearInterval(progressInterval);
                // Set the bar to 100% instantly
                $("#image-progress-bar").text("100%");
                $("#image-progress-bar").width("100%");
                setTimeout(() => {
                    reloadimage(data);
                }, 200);
            },
            xhr: function() {
                // create an XMLHttpRequest
                var xhr = new XMLHttpRequest();

                // listen to the "progress" event
                xhr.upload.addEventListener("progress", async function(evt) {

                    if (evt.lengthComputable) {
                        // calculate the percentage of upload completed
                        var percentComplete = parseInt(evt.loaded / evt.total * uploadCompleteSize);

                        // update the Bootstrap progress bar with the new percentage
                        $("#image-progress-bar").text(percentComplete + "%");
                        $("#image-progress-bar").width(percentComplete + "%");

                        if (percentComplete == uploadCompleteSize) {
                            // This runs when the AJAX request (upload) is finished, regardless of success/error
                            const intervalTime = Math.max(file_size_mb - 1, 0) / 9 * 120 + 80; // 200ms per 1% for 10MB image

                            // Start the progress bar animation
                            progressInterval = setInterval(function() {
                                // Stop the animation at 99% to wait for the actual success callback
                                if (percentComplete < 99) {
                                    percentComplete++;
                                    $("#image-progress-bar").text(percentComplete + "%");
                                    $("#image-progress-bar").width(percentComplete + "%");
                                }
                            }, intervalTime);
                        }
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
var existing_videos = new Set();
$("#video_row source").each(function(){
    existing_videos.add($(this).attr("src"));
});

$("#video_row").on("click", "button", function(){
    let url = $(this).closest(".video_col").find("source").attr("src");
    if (!existing_videos.has(url)) {
        fetch("/delete_asset", {
            method: 'POST',
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({url: url, type: "video"})
        });
    }
    $(this).parent().parent().remove();
});

$(".upload-video-btn").on("click", function (){
    $("#upload-video-input").click();
    $("#video-progress-bar").text("0%");
    $("#video-progress-bar").width("0%");
});

$("#upload-video-input").on("change", function(){
    var files = $(this).get(0).files;
    let file_size_mb = 100;

    if (files.length > 0){
        // create a FormData object which will be sent as the data payload in the
        // AJAX request
        var formData = new FormData();

        // loop through all the selected files and add them to the formData object
        for (var i = 0; i < files.length; i++) {
            var file = files[i];

            file_size_mb = file.size / 1024 / 1024;
            if (file_size_mb > 95) {
                alert("视频大小不可以超过95M");
                return;
            }

            // add the files to formData object for the data payload
            formData.append("uploads[]", file, file.name);
        }

        // Variable to hold the progress interval ID
        let progressInterval;

        $.ajax({
            url: "/upload_video",
            type: "POST",
            data: formData,
            processData: false,
            contentType: false,
            success: function(data) {
                clearInterval(progressInterval);
                // Set the bar to 100% instantly
                $("#video-progress-bar").text("100%");
                $("#video-progress-bar").width("100%");
                setTimeout(() => {
                    reloadvideo(data);
                }, 200);
            },
            xhr: function() {
                // create an XMLHttpRequest
                var xhr = new XMLHttpRequest();

                // listen to the "progress" event
                xhr.upload.addEventListener("progress", async function(evt) {

                    if (evt.lengthComputable) {
                        // calculate the percentage of upload completed
                        var percentComplete = parseInt(evt.loaded / evt.total * 50);

                        // update the Bootstrap progress bar with the new percentage
                        $("#video-progress-bar").text(percentComplete + "%");
                        $("#video-progress-bar").width(percentComplete + "%");

                        if (percentComplete == 50) {
                            // This runs when the AJAX request (upload) is finished, regardless of success/error
                            const intervalTime = Math.max(file_size_mb - 10, 0) / 90 * 600 + 200; // 800ms per 1% for 100MB video

                            // Start the progress bar animation
                            progressInterval = setInterval(function() {
                                // Stop the animation at 99% to wait for the actual success callback
                                if (percentComplete < 99) {
                                    percentComplete++;
                                    $("#video-progress-bar").text(percentComplete + "%");
                                    $("#video-progress-bar").width(percentComplete + "%");
                                }
                            }, intervalTime);
                        }
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


document.addEventListener('DOMContentLoaded', function() {
  const textarea = document.getElementById('description');

  function autoExpand(element) {
    // 1. Reset height to 'auto' to ensure the correct scrollHeight is calculated.
    element.style.height = 'auto';

    // 2. Set height to scrollHeight (content height).
    const scrollHeight = element.scrollHeight;
    element.style.height = scrollHeight + 'px';

    // 3. Max Height Logic:
    // Get the computed max-height from CSS.
    const maxH = parseFloat(window.getComputedStyle(element).maxHeight);

    if (maxH && scrollHeight > maxH) {
      // If content exceeds max-height, keep height at max-height and show scrollbar
      element.style.height = maxH + 'px';
      element.style.overflowY = 'scroll';
    } else {
      // Otherwise, keep height at scrollHeight and hide scrollbar
      element.style.overflowY = 'hidden';
    }
  }

  // Event listener to trigger the expansion on 'input' (when text changes)
  textarea.addEventListener('input', function() {
    autoExpand(this);
  });

  // Run once on page load to set the correct height for pre-filled content
  autoExpand(textarea);
});
