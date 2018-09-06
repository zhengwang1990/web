$(document).ready(function () {

  var data_30day = [{color: data_alltime[0].color, data: []}];
  var current = new Date();
  var today = new Date(current.getFullYear()+'/'+(current.getMonth()+1)+'/'+current.getDate()+' UTC').getTime();
  data_alltime[0].data.forEach(function (d) {
    if ((today - d[0]) < 86400000 * 30) {
      data_30day[0].data.push(d);
    }
  });
  var radius_alltime = Math.max(Math.min(5, 5*30/data_alltime[0].data.length), 1);

  // 30day Graph #############################################
  $.plot($('#graph-30day'), data_30day, {
    series: {
      points: {
        show: true,
        radius: 5
      },
      lines: {
        show: true
      },
      shadowSize: 0
    },
    grid: {
      color: '#646464',
      borderColor: 'transparent',
      borderWidth: 20,
      hoverable: true
    },
    yaxis: {
			tickLength: 5,
      tickDecimals: 0
    },
    xaxis: {
      mode: "time",
      minTickSize: [1, "day"],
      timeformat: "%m/%d"
    },
  });

  // alltime Graph ##############################################
  $.plot($('#graph-alltime'), data_alltime, {
    series: {
      points: {
        show: true,
        radius: radius_alltime
      },
      lines: {
        show: true
      },
      shadowSize: 0
    },
    grid: {
      color: '#646464',
      borderColor: 'transparent',
      borderWidth: 20,
      hoverable: true
    },
    yaxis: {
			tickLength: 5,
      tickDecimals: 0
    },
    xaxis: {
      mode: "time",
      minTickSize: [1, "day"],
      timeformat: "%y/%m/%d"
    },
  });


  // Graph Toggle ############################################
  $('#graph-alltime').hide();

  $('#btn-30day').on('click', function (e) {
    $('#btn-alltime').removeClass('active');
    $('#graph-alltime').fadeOut();
    $(this).addClass('active');
    $('#graph-30day').fadeIn();
    e.preventDefault();
  });

  $('#btn-alltime').on('click', function (e) {
    $('#btn-30day').removeClass('active');
    $('#graph-30day').fadeOut();
    $(this).addClass('active');
    $('#graph-alltime').fadeIn().removeClass('hidden');
    e.preventDefault();
  });

  // Tooltip #################################################
  function showTooltip(x, y, contents) {
    $('<div id="tooltip">' + contents + '</div>').css({
      top: y - 16,
      left: x + 20
    }).appendTo('body').fadeIn();
  }

  var previousPoint = null;

  $('#graph-30day, #graph-alltime').bind('plothover', function (event, pos, item) {
    if (item) {
      if (previousPoint != item.dataIndex) {
        previousPoint = item.dataIndex;
        $('#tooltip').remove();
        var x = new Date(item.datapoint[0]),
        y = item.datapoint[1];
        showTooltip(item.pageX, item.pageY, y + '次访问于 ' + (x.getUTCMonth()+1) + '/' + x.getUTCDate());
      }
    } else {
      $('#tooltip').remove();
      previousPoint = null;
    }
  });
});
