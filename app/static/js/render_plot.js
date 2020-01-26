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

// SVG prep
var svg = d3.select("div#svg-container").append("svg")
            .attr("width",width+2*margin)
            .attr("height",height+2*margin)
            .classed("svg-content",true) // Set class to svg-contentf
            .append("g")
            .attr("transform",
                "translate(" + margin + "," + margin + ")");
            
// Axes prep
var x = d3.scaleLinear().range([0,width]).domain([0,100]);
var y = d3.scaleLinear().range([height,0]).domain([-30,30]);

window.addEventListener('resize', function(event){
    width = (window.innerWidth * 5 / 6) - 2 * margin;
    height = window.innerHeight * 4 / 6;
    x.range([0,width]);
    y.range([height,0]);
    d3.select(".svg-content")
            .attr("width",width+2*margin)
            .attr("height",height+2*margin);
    d3.select("g#xaxis-containter").remove();
    d3.select("g#yaxis-containter").remove();
    svg.append("g")
        .attr("transform","translate(0," + height + ")")
        .attr("id","xaxis-containter")
        .call(d3.axisBottom(x));
    svg.append("g")
        .attr("id","yaxis-containter")
        .call(d3.axisLeft(y));
});


// Environment Prep
x_type_defaults = [{},{value: 'nm', name: 'Wavelength'},
                    {value: 'ev', name: 'Energy'},
                    {value: 'wn', name: 'Wavenumber'}];
d3.select("#x_type").selectAll("div")
    .data(x_type_defaults).enter().append("div")
    .classed("row", true)
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
    x.domain(d3.extent(msg.x));
    y.domain([0,4000]);
    d3.select("g#xaxis-containter").remove();
    d3.select("g#yaxis-containter").remove();
    svg.append("g")
        .attr("transform","translate(0," + height + ")")
        .attr("id","xaxis-containter")
        .call(d3.axisBottom(x));
    svg.append("g")
        .attr("id","yaxis-containter")
        .call(d3.axisLeft(y));
    specLine = d3.line()
                .x(function(dd) { 
                    return x(dd.x); 
                })
                .y(function(dd) { 
                    return y(dd.y);
                });
        
    current_data = msg.y.map(function(yy,i) {
        return {x: msg.x[i], y: yy};
    });
    // Clear old lines
    d3.selectAll("path.line").remove();
    // Draw Lines
    svg.append("path")
        .attr("d",specLine(current_data))
        .attr("id","line-" + 0)
        .attr("class","line")
        .style("stroke-opacity", 1.0)
        .text('Walk');
    
    it_input.property("value",msg.it)
    ave_input.property("value",msg.ave)
    
    get_xy()
});

get_xy = function() {
    socket.emit('get_xy')
};

socket.on('update_xy', function(msg) {
    specLine = d3.line()
                .x(function(dd) { 
                    return x(dd.x); 
                })
                .y(function(dd) { 
                    return y(dd.y);
                });
        
    current_data = msg.y.map(function(yy,i) {
        return {x: msg.x[i], y: yy};
    });
    // Clear old lines
    d3.selectAll("path.line").remove()
    // Draw Lines
    svg.append("path")
        .attr("d",specLine(current_data))
        .attr("id","line-" + 0)
        .attr("class","line")
        .style("stroke-opacity", 1.0)
        .text('Walk');
    
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

add_overlay = function() {
    overlays.push({data: current_data});
    console.log(overlays);
    specLine = d3.line()
                .x(function(dd) { 
                    return x(dd.x); 
                })
                .y(function(dd) { 
                    return y(dd.y);
                });
    // Clear old overlays
    d3.selectAll("path.line").remove()
    d3.selectAll("path.overlay").remove()
    // Draw overlays
    svg.selectAll("path")
        .data([{data: current_data}].concat(overlays)).enter()
        .append("path")
        .attr("d",function (d) {return specLine(d.data);})
        .attr("id",function (d,i) {return "line-" + i;})
        .attr("class",function (d,i) {
            if (i ==0) {
                return "line";
            } else {
                return "overlay"
            }
        })
        .style("stroke-opacity", 1.0)
        .text('Walk');
        
};

on_load = function() {
    setup_spectrometer();
};