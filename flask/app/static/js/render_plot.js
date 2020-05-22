// ----- Setup Plotting ----- //
// params
var margin = 50;
var width = (window.innerWidth * 5 / 6) - 2 * margin;
var height = window.innerHeight * 4 / 6;
var visible = 0;
//var it_index = 0;
var continuous_run = true;
var current_data = [];
var overlays = [];

// Plotter prep
var plot = new Plot("div#svg-container", width, height, margin)

window.addEventListener('resize', function(event){
    width = (window.innerWidth * 5 / 6) - 2 * margin;
    height = window.innerHeight * 4 / 6;
    plot.resize(width,hieght,margin).draw_axes();
});


// Environment Prep
x_type_defaults = [{},{value: 'nm', name: 'Wavelength'},
                    {value: 'ev', name: 'Energy'},
                    {value: 'wn', name: 'Wavenumber'}];
d3.select("#x_type").selectAll("div")
    .data(x_type_defaults).enter().append("div")
    .classed("row", true)
    .classed("m-0", true).append("div")
    .classed("col", true)
    .classed("text-center", true)
    .text(function (d) {return d.name;})
    .insert("input")
    .attr("type","radio")
    .attr("name","x_type_rb")
    .attr("value", function (d) {return d.value; })
    .property("checked", function (d,i){
        return i === 0+1;
    })
    .on("change",function() {
        setup_spectrometer({x_type: this.value});
    });

y_type_defaults = [{},{value: 'i', name: 'Intensity'},
                    {value: 'z', name: 'Zeroed'},
                    {value: 't', name: 'Transmission'},
                    {value: 'r', name: 'Reflection'},
                    {value: 'a', name: 'Absorbance'}];
d3.select("#y_type").selectAll("div")
    .data(y_type_defaults).enter().append("div")
    .classed("row", true)
    .classed("m-0", true).append("div")
    .classed("col", true)
    .classed("text-center", true)
    .text(function (d) {return d.name;})
    .insert("input")
    .attr("type","radio")
    .attr("name","y_type_rb")
    .attr("value", function (d) {return d.value; })
    .property("checked", function (d,i){
        return i === 0+1;
    })
    .on("change",function() {
        setup_spectrometer({y_type: this.value});
    });

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
        pparams = {x_type:'nm',y_type:'i',it:'100',ave:'1'};
    } else {
        pparams = params;
    };
    console.log("Params passed to Python: ");
    console.log(pparams);
    socket.emit('setup_spectrometer', pparams)
};

socket.on('set_up_plot', function(msg) {

  current_data = msg.y.map(function(yy,i) {
      return {x: msg.x[i], y: yy};
  });
  // console.log(current_data)
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
    current_data = msg.y.map(function(yy,i) {
        return {x: msg.x[i], y: yy};
    });

    plot.update_active_data(current_data)
        .draw_line();

    if (continuous_run) {
        get_xy();
    };
});



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

save_as = function() {
    let res = [];
    for (let d of current_data) {
        res.push(d.x + "," + d.y + "\n");
    };
    let blob = new Blob(res, {type: "text/plaintext;charset=utf-8"});
    saveAs(blob, "spectra.csv");
};

add_overlay = function() {};

on_load = function() {
    setup_spectrometer();
};
