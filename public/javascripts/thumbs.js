var clicked = {}

$(".thumbs").on("click",  function(){
    var button_id = $(this).attr("id");
    var patterns = button_id.split('-');
    var profile_id = patterns[0];
    var action = patterns[1];
    if (clicked[profile_id]) return;
    var font_id = "#" + button_id + "-font";
    $(font_id).removeClass("far");
    $(font_id).addClass("fas");
    var value_id = "#" + button_id + "-value";
    $(value_id).text(parseInt($(value_id).text())+1);
    clicked[profile_id] = true;
    var xhttp = new XMLHttpRequest();
    xhttp.open("PUT", "/"+profile_id+"/thumbs/"+action, true);
    xhttp.send(null);
});
