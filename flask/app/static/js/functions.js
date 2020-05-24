// ----- Setup Plotting ----- //
// Global Variables
var margin = 50;
var width = (window.innerWidth * 5 / 6) - 2 * margin;
var height = window.innerHeight * 4 / 6;
var continuous_run = true;
var plot = new Plot("div#svg-container", width, height, margin);
var it_input = d3.select("#it");
var ave_input = d3.select("#ave");


// ----- Setup the socket connection ----- //
var socket = io('/plot');
// event handlers
socket.on('connect', function() {
    socket.emit('send_message', {data: "connected on js"})
});
socket.on('log_on_client', function(msg, cb) {
    d3.select("div#log")
        .append("p")
        .text("Recieved: " + msg.data);
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
      .set_x_scale("wavelength")
      .set_y_scale("intensities")
      .draw_axes()
      .draw_line();

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

save_as = function() {
    let res = [];
    for (let d of plot.line.get_data()) {
        res.push(d.X + "," + d.Y + "\n");
    };
    let blob = new Blob(res, {type: "text/plaintext;charset=utf-8"});
    saveAs(blob, "spectra.csv");
};

add_overlay = function() {};


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
    plot.resize(width,height,margin).draw_axes();
});
