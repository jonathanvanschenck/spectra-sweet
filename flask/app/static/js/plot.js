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
    check: (obj) => true,
    unit: "counts",
    lim: [0,4000]
  },
  zeroed: {
    map:(d) => {return d.y-d.d;},
    check: (obj) => obj.has_dark(),
    unit: "counts",
    lim: [0,4000]
  },
  absorbance: {
    map:(d) => {return -math.log10((d.y-d.d)/(d.w-d.d));},
    check: (obj) => obj.has_dark() && obj.has_white(),
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
    this.X = x_conv[name].map
    return this
  };
  set_y_scale(name) {
    this.Y = y_conv[name].map
    this.check = y_conv[name].check
    return this
  };

  set_data(data){
    this.data = data;
    return this
  }
  update_data(data) {
    this.data.forEach((d,i) => {d.x = data[i].x; d.y = data[i].y});
    return this
  };
  update_xdata(data) {
    this.data.forEach((d,i) => {d.x = data[i].x});
    return this
  };
  update_ydata(data) {
    this.data.forEach((d,i) => {d.y = data[i].y});
    return this
  };

  set_white(data) {
    this.data.forEach((d,i) => {d.w = data[i].y});
    return this
  };
  has_white() {
    return !!this.data[0].w
  }
  set_dark(data) {
    this.data.forEach((d,i) => {d.d = data[i].y});
    return this
  };
  has_dark() {
    return !!this.data[0].d
  };

  get_data() {
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
    return this
  };
  get_width() {
    return this.x.range()[1]
  }

  set_height(height) {
    this.y.range([height,0]);
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

  // Get transformer for plotting data
  get_transformer() {
    let x = this.x;
    let y = this.y;
    return d3.line().x(function(dd) {
                        return x(dd.X);
                    })
                    .y(function(dd) {
                        return y(dd.Y);
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

    // Connect and draw
    this.resize(width,height,margin).draw_axes();

    return this
  };

  resize(width,height,margin) {
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
    // Remove any old axes
    this.viewport.selectAll("g#xaxis-containter").remove();
    this.viewport.selectAll("g#yaxis-containter").remove();
    // Attach new axes
    this.viewport.append("g")
        .attr("transform","translate(0," + this.ax.get_height() + ")")
        .attr("id","xaxis-containter")
        .call(this.ax.get_x_generator());
    this.viewport.append("g")
        .attr("id","yaxis-containter")
        .call(this.ax.get_y_generator());

    return this
  };

  set_active_data(data){
    this.line.set_data(data);

    return this
  };
  update_active_data(data){
    this.line.update_data(data);

    return this
  };

  draw_line() {
    // Clear line
    this.viewport.selectAll("#line-0").remove();
    // Draw Line
    this.viewport.append("path")
        .attr("d",this.ax.get_transformer()(this.line.get_data()))
        .attr("id","line-0")
        .attr("class","line")
        .style("stroke-opacity", 1.0)

    return this
  }

  set_x_scale(name) {
    this.line.set_x_scale(name);
    let x = this.line.get_data().map(d => {return d.X});
    this.ax.set_x_lim(d3.extent(x));

    return this
  };
  set_y_scale(name) {
    this.line.set_y_scale(name);
    this.ax.set_y_lim(y_conv[name].lim);

    return this
  };
};
