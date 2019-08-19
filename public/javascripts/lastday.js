function getDayLeft(lastday) {
    var dateElems = lastday.split("-")
    lastday = new Date(parseInt(dateElems[0]), parseInt(dateElems[1])-1, parseInt(dateElems[2]));
    var today = new Date();
    var dayleft = Math.ceil((lastday - today) / (1000 * 60 * 60 * 24)) + 1;
    return Math.max(dayleft, 0);
}

$(document).ready(function(){
    $(".dayleft-num").each(function(i, obj){
        var lastday = $(this).attr("lastday");
        var dayleft = getDayLeft(lastday);
        $(this).html(dayleft);
    });

    $(".dayleft-progress").each(function(i, obj){
        var lastday = $(this).attr("lastday");
        var dayleft = getDayLeft(lastday);
        var html = "";
        for (var i = 0; i < dayleft; i++){
            html += "&thinsp; <span class='progress-span'></span>"
        }
	$(this).html(html);
    });
});
