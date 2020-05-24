

on_load = function() {
  // Environment Prep
  let conf_type_defaults = [{},{value: 'Set Background', func: set_dark},
                              {value: 'Set Reference', func: set_white}];
  d3.select("#conf_type").selectAll("div")
      .data(conf_type_defaults).enter().append("div")
      .classed("row", true)
      .classed("m-0", true).append("div")
      .classed("col", true)
      .classed("text-center", true)
      .insert("input")
      .attr("type","button")
      .classed("btn", true)
      .classed("btn-success", true)
      .classed("w-100", true)
      .classed("mb-1", true)
      .classed("conf_type_rb",true)
      .attr("value", (d) => {return d.value;})
      .on("click", (d) => {d.func()});

  let x_type_defaults = [{},{value: 'wavelength', name: 'Wavelength'},
                      {value: 'energy', name: 'Energy'},
                      {value: 'wavenumber', name: 'Wavenumber'}];
  d3.select("#x_type").selectAll("div")
      .data(x_type_defaults).enter().append("div")
      .classed("row", true)
      .classed("m-0", true).append("div")
      .classed("col", true)
      .classed("text-center", true)
      .insert("input")
      .attr("type","button")
      .classed("btn", true)
      .classed("btn-success", true)
      .classed("w-100", true)
      .classed("mb-1", true)
      .classed("x_type_rb",true)
      .attr("value", (d) => {return d.value;})
      .on("click",function() {
        plot.set_x_scale(this.value)
            .draw_axes()
            .draw_line()
      });

  let y_type_defaults = [{},{value: 'intensities', name: 'Intensities', abled: true},
                      {value: 'zeroed', name: 'Zeroed', abled: false},
                      // {value: 't', name: 'Transmission'},
                      // {value: 'r', name: 'Reflection'},
                      {value: 'absorbance', name: 'Absorbance', abled: false}];
  d3.select("#y_type").selectAll("div")
      .data(y_type_defaults).enter().append("div")
      .classed("row", true)
      .classed("m-0", true).append("div")
      .classed("col", true)
      .classed("text-center", true)
      .insert("input")
      .attr("type","button")
      .classed("btn", true)
      .classed("btn-success", true)
      .classed("w-100", true)
      .classed("mb-1", true)
      .classed("y_type_rb",true)
      .attr("value", (d) => {return d.value;})
      .attr("disabled", (d) => {return d.abled ? null : true;})
      .classed("btn-disabled", (d) => {return d.abled ? false : true;})
      .on("click",function() {
        plot.set_y_scale(this.value)
            .draw_axes()
            .draw_line()
      });

  setup_spectrometer();
};
