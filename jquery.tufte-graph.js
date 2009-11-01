(function($) {
  //
  // Public interface
  //

  // The main event - creates a pretty graph. See index.html for documentation.
  $.fn.tufteBar = function(options) {
    var defaultCopy = $.extend(true, {}, $.fn.tufteBar.defaults);
    var options =     $.extend(true, defaultCopy, options);

    return this.each(function () {
      draw(makePlot($(this), options), options);
    });
  }

  // Defaults are exposed publically so you can reuse bits that you find 
  // handy (the colors, for instance)
  $.fn.tufteBar.defaults = {
    barWidth:  0.8,
    colors:    ['#07093D', '#0C0F66', '#476FB2'],
    color:     function(index, stackedIndex, options) { return options.colors[stackedIndex % options.colors.length]; },
    barLabel:  function(index, stackedIndex) { 
      return $.tufteBar.formatNumber(totalValue(this[0])); 
    },
    axisLabel: function(index, stackedIndex) { return index; },
    legend: {
      color: function(index, options) { return options.colors[index % options.colors.length]; },
      label: function(index) { return this; }
    }
  }

  $.tufteBar = {
    // Add thousands separators to a number to make it look pretty.
    // 1000 -> 1,000
    formatNumber: function(nStr) {
      // http://www.mredkj.com/javascript/nfbasic.html
      nStr += '';
      x = nStr.split('.');
      x1 = x[0];
      x2 = x.length > 1 ? '.' + x[1] : '';
      var rgx = /(\d+)(\d{3})/;
      while (rgx.test(x1)) {
        x1 = x1.replace(rgx, '$1' + ',' + '$2');
      }
      return x1 + x2;
    }
  }

  //
  // Private functions
  //

  // This function should be applied to any option used from the options hash.
  // It allows options to be provided as either static values or functions which are
  // evaluated each time they are used
  function resolveOption(option, element) {
    // the @arguments@ special variable looks like an array, but really isn't, so we 
    // need to transform it in order to perform array function on it
    function toArray() {
      var result = []
      for (var i = 0; i < this.length; i++)
        result.push(this[i])
      return(result)
    }

    return $.isFunction(option) ? option.apply(element, toArray.apply(arguments).slice(2, arguments.length)) : option;
  }

  // Returns the total value of a bar, for labeling or plotting. Y values can either be 
  // a single number (for a normal graph), or an array of numbers (for a stacked graph)
  function totalValue(value) {
    if (value instanceof Array) 
      return $.sum(value);
    else
      return value;
  }

  function draw(plot, options) {
    var ctx = plot.ctx;
    var axis = plot.axis;

    // Iterate over each bar
    $(options.data).each(function (i) {
      var element = this;
      var x = i + 0.5;
      var all_y = null;

      if (element[0] instanceof Array) {
        // This is a stacked bar, so the data is all good to go
        all_y = element[0];
      } else {
        // This is a normal bar, wrap in an array to make it a stacked bar with one data point
        all_y = [element[0]];
      }

      if ($(all_y).any(function() { return isNaN(+this); })) {
        throw("Non-numeric value provided for y: " + element[0]);
      }

      var lastY = 0;

      pixel_scaling_function = function(axis) {
        var scale = axis.pixelLength / (axis.max - axis.min);
        return function (value) {
          return (value - axis.min) * scale;
        }
      }

      // These functions transform a value from plot coordinates to pixel coordinates
      var t = {}
      t.W = pixel_scaling_function(axis.x);
      t.H = pixel_scaling_function(axis.y);
      t.X = t.W;
      // Y needs to invert the result since 0 in plot coords is bottom left, but 0 in pixel coords is top left
      t.Y = function(y) { return axis.y.pixelLength - t.H(y) }; 

      // Iterate over each data point for this bar and render a rectangle for each
      $(all_y).each(function(stackedIndex) {
        var optionResolver = function(option) { // Curry resolveOption for convenience
          return resolveOption(option, element, i, stackedIndex, options);
        }

        var y = all_y[stackedIndex];
        var halfBar = optionResolver(options.barWidth) / 2;
        var left   = x - halfBar,
            width  = halfBar * 2,
            top = lastY + y,
            height = y;

        // Need to both fill and stroke the rect to make sure the whole area is covered
        // You get nasty artifacts otherwise
        var color = optionResolver(options.color);
        var coords = [t.X(left), t.Y(top), t.W(width), t.H(height)];

        ctx.rect(coords[0], coords[1], coords[2], coords[3]).attr({stroke: color, fill: color});

        lastY = lastY + y;
      });

      addLabel = function(klass, text, pos) {
        html = '<div style="position:absolute;" class="label ' + klass + '">' + text + "</div>";
        $(html).css(pos).appendTo( plot.target );        
      }

      var optionResolver = function(option) { // Curry resolveOption for convenience
        return resolveOption(option, element, i, options);
      }
      addLabel('bar-label', optionResolver(options.barLabel), {
        left:   t.X(x - 0.5),
        bottom: t.H(lastY),
        width:  t.W(1)
      });
      addLabel('axis-label', optionResolver(options.axisLabel), {
        left:  t.X(x - 0.5),
        top:   t.Y(0),
        width: t.W(1)
      });
    });
    addLegend(plot, options);
  }

  // If legend data has been provided, transform it into an 
  // absolutely positioned table placed at the top right of the graph
  function addLegend(plot, options) {
    if (options.legend.data) {
      elements = $(options.legend.data).collect(function(i) {
        var optionResolver = (function (element) {
          return function(option) { // Curry resolveOption for convenience
            return resolveOption(option, element, i, options);
          }
        })(this);  

        var colorBox = '<div class="color-box" style="background-color:' + optionResolver(options.legend.color) + '"></div>';
        var label = optionResolver(options.legend.label);

        return "<tr><td>" + colorBox + "</td><td>" + label + "</td></tr>";
      });

      $('<table class="legend">' + elements.reverse().join("") + '</table>').css({
        position: 'absolute',
        top:  '0px',
        left: plot.width + 'px'
      }).appendTo( plot.target );
    }
  }

  // Calculates the range of the graph by looking for the 
  // maximum y-value
  function makeAxis(options) {
    var axis = {
      x: {},
      y: {}
    }

    axis.x.min = 0
    axis.x.max = options.data.length;
    axis.y.min = 0;
    axis.y.max = 0;

    $(options.data).each(function() {
      var y = totalValue(this[0]);
      if( y < axis.y.min ) throw("Negative values not supported");
      if( y > axis.y.max ) axis.y.max = y;
    });
    
    if( axis.x.max <= 0) throw("You must have at least one data point");
    if( axis.y.max <= 0) throw("You must have at least one y-value greater than 0");

    return axis;
  }

  // Creates the canvas object to draw on, and set up the axes
  function makePlot(target, options) {
    var plot = {};
    plot.target = target;
    plot.width = target.width();
    plot.height = target.height();
    target.html( '' ).css( 'position', 'relative' );

    if( plot.width <= 0 || plot.height <= 0 ) {
        throw "Invalid dimensions for plot, width = " + plot.width + ", height = " + plot.height;
    }

    // the canvas
    plot.ctx = Raphael(target[0].id, plot.width, plot.height);

    plot.axis = makeAxis(options);
    plot.axis.x.pixelLength = plot.width;
    plot.axis.y.pixelLength = plot.height;

    return plot;
  }
} )( jQuery );
