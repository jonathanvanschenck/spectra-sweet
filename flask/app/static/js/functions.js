// ----- Setup Plotting ----- //
// Global Variables
var margin = 60;
var width = (window.innerWidth * 5 / 6) - 2 * margin;
var height = window.innerHeight * 4 / 6;
var continuous_run = true;
var plot = new Plot("div#svg-container", width, height, margin);
var it_input = d3.select("#it");
var ave_input = d3.select("#ave");
var overlay_tags = d3.select("#overlay-tag-container");


// ----- Setup the socket connection ----- //
var socket = io('/plot');
// event handlers
socket.on('connect', function() {
    socket.emit('send_message', {data: "connected on js"})
});
socket.on('log_on_client', function(msg, cb) {
    console.log(msg);
    if (cb)
        cb();
});


setup_spectrometer = function(params) {
    if (!params) {
        pparams = {it:'100',ave:'1'};
    } else {
        pparams = params;
    };
    console.log("Params passed to Python: ");
    console.log(pparams);
    socket.emit('setup_spectrometer', pparams)
};

socket.on('set_up_plot', function(msg) {

  let current_data = msg.y.map(function(yy,i) {
      return {x: msg.x[i], y: yy};
  });

  plot.set_active_data(current_data)
      .set_x_scale(plot.line.x_scale_name)
      .set_y_scale(plot.line.y_scale_name)
      .draw_axes()
      .draw_line()
      .draw_overlays();

  it_input.property("value",msg.it)
  ave_input.property("value",msg.ave)

  get_xy()
});

get_xy = function() {
    socket.emit('get_xy')
};

socket.on('update_xy', function(msg) {
    let current_data = msg.y.map(function(yy,i) {
        return {x: msg.x[i], y: yy};
    });

    plot.set_active_data(current_data)
        .draw_line();

    if (continuous_run) {
        get_xy();
    };
});


// ----- Button Functions ----- //
play = function() {
    continuous_run = true;
    setup_spectrometer({it: it_input.property("value"),
                        ave: ave_input.property("value")});
};

pause = function() {
    continuous_run = false;
};

single = function() {
    continuous_run = false;
    setup_spectrometer({it: it_input.property("value"),
                        ave: ave_input.property("value")});
};

set_white = function() {
  plot.set_white();
  d3.selectAll("input.y_type_rb")
    .attr("disabled",(d) => {
      return plot.line.can_plot(d.value) ? null : true;
    }).classed("btn-disabled", (d) => {
      return plot.line.can_plot(d.value) ? false : true;
    })
};

set_dark = function() {
  plot.set_dark();
  d3.selectAll("input.y_type_rb")
    .attr("disabled",(d) => {
      return plot.line.can_plot(d.value) ? null : true;
    }).classed("btn-disabled", (d) => {
      return plot.line.can_plot(d.value) ? false : true;
    })
};

save_active = function() {
    let res = [];
    for (let d of plot.line.get_data()) {
        res.push(d.X + "," + d.Y + "\n");
    };
    let blob = new Blob(res, {type: "text/plaintext;charset=utf-8"});
    saveAs(blob, "spectra.csv");
};

save_all = function() {
  // TODO:
};

save_raw = function() {
  // TODO:
};

add_overlay = function() {
  plot.attach_overlay().draw_overlays()
  create_overlay_tags()
};

create_overlay_tags = function() {
  // TODO: This is bad, becuase it changes the colors of all the overlays
  overlay_tags.selectAll("div").remove()
  plot.overlays.map((overlay,i) => {
    overlay_tags.append("div")
                .classed("row",true)
                .classed("md-1",true)
                .append("button")
                .text("Overlay - " + (i+1))
                .classed("btn",true)
                .classed("btn-info",true)
                .on("click",() => {
                  plot.drop_overlay(i)
                      .draw_overlays();
                  create_overlay_tags();
                });
  });
}

// ----- Window Listeners and functions ----- //

// Hotkeys
document.addEventListener('keydown', (event) => {
  if (event.altKey && event.shiftKey && event.ctrlKey) {
    if      (event.key === "D") {set_dark();}
    else if (event.key === "W") {set_white();}
  }
});

// Plot Resizer
window.addEventListener('resize', function(event){
    width = (window.innerWidth * 5 / 6) - 2 * margin;
    height = window.innerHeight * 4 / 6;
    plot.resize(width,height,margin)
        .draw_axes()
        .draw_line()
        .draw_overlays();
});
