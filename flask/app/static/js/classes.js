// module to hold d3.js plot extension
const x_conv = {
  wavelength: {
    map:(d) => {return d.x;},
    unit: "nm"
  },
  energy: {
    map:(d) => {return 1238/d.x;},
    unit: "eV"
  },
  wavenumber: {
    map:(d) => {return 10000000/d.x;},
    unit: "1/cm"
  }
};

const y_conv = {
  intensities: {
    map:(d) => {return d.y;},
    check: (obj) => {return true;},
    unit: "counts",
    lim: [0,4000]
  },
  zeroed: {
    map:(d) => {return d.y-d.d;},
    check: (obj) => {return obj.has_dark();},
    unit: "counts",
    lim: [0,4000]
  },
  absorbance: {
    map:(d) => {return Math.log10((d.y-d.d)/(d.w-d.d));},
    check: (obj) => {return obj.has_dark() && obj.has_white();},
    unit: "A.U.",
    lim: [0,2.5]
  }
};


class Line {
  constructor(data,x_scale_name='wavelength',y_scale_name='intensities') {
    this.data = data
    this.set_x_scale(x_scale_name).set_y_scale(y_scale_name);

    return this
  };

  set_x_scale(name) {
    this.X = x_conv[name].map;
    this.x_scale_name = name;
    return this
  };
  set_y_scale(name) {
    this.Y = y_conv[name].map
    this.check = y_conv[name].check
    this.y_scale_name = name;
    return this
  };
  can_plot(name) {
    return y_conv[name].check(this);
  };

  set_data(data) {
    // Function sets xy data (doesn't effect d/w if they exist)
    data.forEach((d,i) => {
      // Ensure data entry exists
      if (!this.data[i]) {
        this.data[i] = {};
      }
      // Write over xy (but not d/w if they exist)
      this.data[i].x = d.x;
      this.data[i].y = d.y;
    });
    return this
  };

  set_white(data) {
    // NOTE: Should I include a check that data and this.data have the same length?
    this.data.forEach((d,i) => {d.w = data[i].y});
    return this
  };
  has_white() {
    // Ensure all data points have a "w"
    let bool = true;
    this.data.forEach((d,i) => {bool = bool && !(d.w===undefined)});
    return bool;
  };
  set_dark(data) {
    // NOTE: Should I include a check that data and this.data have the same length?
    this.data.forEach((d,i) => {d.d = data[i].y});
    return this
  };
  has_dark() {
    // Ensure all data points have a "d"
    let bool = true;
    this.data.forEach((d,i) => {bool = bool && !(d.d===undefined)});
    return bool;
  };

  get_XY() {
    if (!this.check(this)) {
      return [];
    }
    let x_trans = this.X;
    let y_trans = this.Y;
    return this.data.map(d => {
      return {
        X: x_trans(d),
        Y: y_trans(d)
      };
    })
  };

  copy() {
    let newData = this.data.map((d) => {
      let obj = {x:d.x, y:d.y}
      if (!(d.w===undefined)) {obj.w = d.w}
      if (!(d.d===undefined)) {obj.d = d.d}
      return obj
    });
    return new Line(newData,this.x_scale_name,this.y_scale_name);
  }
}



class Axes {
  constructor(width, height, xmin, xmax, ymin, ymax) {
    this.x = d3.scaleLinear();
    this.y = d3.scaleLinear();

    this.set_width(width).set_x_lim(xmin, xmax)
        .set_height(height).set_y_lim(ymin, ymax);

    return this
  }

  set_width(width) {
    this.x.range([0,width]);
    this.width = width;
    return this
  };
  get_width() {
    return this.x.range()[1]
  }

  set_height(height) {
    this.y.range([height,0]);
    this.height = height;
    return this
  };
  get_height() {
    return this.y.range()[0]
  }

  __set_lim(which, _min, _max) {
    let axis = this[which];
    if (_min.length) { // check array
      axis.domain(_min);
    } else { // else handle arg list
      let xlim = axis.domain();
      if (_min) {
        xlim[0] = _min;
      }
      if (_max) {
        xlim[1] = _max;
      }
      axis.domain(xlim);
    }
    return this
  }
  set_x_lim(xmin,xmax) {
    return this.__set_lim('x',xmin,xmax)
  };
  set_y_lim(xmin,xmax) {
    return this.__set_lim('y',xmin,xmax)
  };

  // Get axis generators for attaching to plot
  get_x_generator() {
    return d3.axisBottom(this.x)
  }
  get_y_generator() {
    return d3.axisLeft(this.y)
  }

  // Get transformer for converting XY data to px,py space
  get_transformer() {
    let x = this.x;
    let y = this.y;
    return d3.line().x(function(d) {
                        return x(d.X);
                    })
                    .y(function(d) {
                        return y(d.Y);
                    })
  }
}


class Plot{
  constructor(svg_container_name, width, height, margin){
    // SVG prep
    this.svg = d3.select(svg_container_name).append("svg")
                .classed("svg-content",true) // Set class to svg-content
    this.viewport = this.svg.append("g");

    // Axes Prep
    this.ax = new Axes(width, height, 0, 100, -30, 30)

    // Active line Prep
    this.line = new Line([])

    // Overlay line prep
    this.overlays = [];

    // Connect and draw
    this.resize(width,height,margin).draw_axes();

    return this
  };

  resize(width,height,margin) {
    this.width = width;
    this.height = height;
    this.margin = margin;
    // Totally clear the viewport
    // this.viewport.selectAll().remove()
    // Set w/h
    this.svg.attr("width",width+2*margin)
            .attr("height",height+2*margin)
    // Modify viewport
    this.viewport.attr("transform","translate(" + margin + "," + margin + ")");
    // Set Axes
    this.ax.set_width(width).set_height(height);
    return this
  };

  draw_axes() {
    // Remove any old axes or lines
    this.viewport.selectAll("g").remove();
    this.viewport.selectAll("path").remove();
    this.viewport.selectAll("text").remove();

    // Attach new axes
    this.viewport.append("g")
        .attr("transform","translate(0," + this.ax.get_height() + ")")
        .attr("id","xaxis-containter")
        .call(this.ax.get_x_generator());
    this.viewport.append("g")
        .attr("id","yaxis-containter")
        .call(this.ax.get_y_generator());

    // Attach labels
    this.viewport.append("text")
        .attr("transform", "translate(" + (this.width / 2) + "," + (this.height + this.margin) + ")")
        .style("text-anchor", "middle")
        .text(this.x_label);
    this.viewport.append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", 0 - this.margin)
        .attr("x",0 - (this.height / 2))
        .attr("dy", "1em")
        .style("text-anchor", "middle")
        .text(this.y_label);

    return this
  };

  set_active_data(data){
    this.line.set_data(data);

    return this
  };

  draw_line() {
    // Clear line
    this.viewport.selectAll("#line-0").remove();
    // Draw Line
    this.viewport.append("path")
        .attr("d",this.ax.get_transformer()(this.line.get_XY()))
        .attr("id","line-0")
        .attr("class","line")
        .style("stroke-opacity", 1.0)

    return this
  }

  attach_overlay() {
    this.overlays.push(this.line.copy())

    return this
  };

  drop_overlay(i) {
    this.overlays = this.overlays.slice(0,i).concat(this.overlays.slice(i+1))

    return this
  }

  drop_all_overlays(i) {
    this.overlays = []

    return this
  }

  draw_overlays() {
    // Clear old overlays
    this.viewport.selectAll(".line").filter(function() {
      return !(this.id === "line-0");
    }).remove();

    // Draw overlays
    this.overlays.map((overlay,i) => {
      this.viewport.append("path")
          .attr("d",this.ax.get_transformer()(overlay.get_XY()))
          .attr("id","line-" + (i+1))
          .attr("class","line")
          .style("stroke-opacity", 1.0)
    });

    return this
  };

  set_x_scale(name) {
    this.line.set_x_scale(name);
    this.overlays.map((overlay) => {overlay.set_x_scale(name)});
    let x = this.line.get_XY().map(d => {return d.X});
    this.ax.set_x_lim(d3.extent(x));
    this.set_x_label(name);

    return this
  };
  set_y_scale(name) {
    this.line.set_y_scale(name);
    this.overlays.map((overlay) => {overlay.set_y_scale(name)});
    this.ax.set_y_lim(y_conv[name].lim);
    this.set_y_label(name);

    return this
  };

  set_x_label(label) {
    this.x_label = label;
    return this;
  };
  set_y_label(label) {
    this.y_label = label;
    return this;
  };

  set_dark() {
    this.line.set_dark(this.line.data);
    return this
  }
  set_white() {
    this.line.set_white(this.line.data);
    return this
  }
};
