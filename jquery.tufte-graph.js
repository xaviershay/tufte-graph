(function($) {
  $.fn.tufteBar = function(options) {
    var options = $.extend({}, $.fn.tufteBar.defaults, options);
    // Transform normal bar data into data for a stacked bar, by making
    // the y-value into an array
    options.data = $.map(options.data, function(element) {
      var ret = [[element[0].length ? element[0] : [element[0]], element[1]]];
      ret[0][0].sum = function () { return sum(ret[0][0]); };
      return ret;
    });

    return this.each(function () {
      draw(makePlot($(this), options), options);
    });
  }

  $.fn.tufteBar.defaults = {
    barWidth:  0.8,
    color:     function(element, index, stackedIndex) { return ['#07093D', '#0C0F66', '#476fb2'][stackedIndex % 3]; },
    barLabel:  function(element, index, stackedIndex) { return sum(element[0]); },
    axisLabel: function(element, index, stackedIndex) { return index; }
  }

  //
  // Private functions
  //
  function resolveOption(option, element, index, stackedIndex) {
    return $.isFunction(option) ? option(element, index, stackedIndex) : option;
  }

  function draw(plot, options) {
    var ctx = plot.ctx;
    var axis = plot.axis;

    for (var i = 0; i < options.data.length; ++i) {
      var element = options.data[i];
      var x = i + 0.5,
          all_y = element[0];

      var lastY = 0;

      var tX = function(x) { return               ( x - axis.x.min ) * (plot.width  / (axis.x.max - axis.x.min)); }
      var tY = function(y) { return plot.height - ( y - axis.y.min ) * (plot.height / (axis.y.max - axis.y.min)); }

      ctx.save();
      for (var stackedIndex = 0; stackedIndex < all_y.length; stackedIndex++) {
        var optionResolver = function(option) { // Curry resolveOption for convenience
          return resolveOption(option, element, i, stackedIndex);
        }

        var y = all_y[stackedIndex];
        var halfBar = optionResolver(options.barWidth) / 2;
        var left   = x - halfBar,
            width  = halfBar * 2,
            bottom = lastY,
            height = y;

        ctx.fillStyle   = optionResolver(options.color);
        ctx.strokeStyle = optionResolver(options.color);
        ctx.fillRect( tX(left), tY(bottom) - (plot.height - tY(height)), tX(width), plot.height - tY(height) );
        ctx.strokeRect( tX(left), tY(bottom) - (plot.height - tY(height)), tX(width), plot.height - tY(height) );
        lastY = lastY + y;
      }
      ctx.restore();

      addLabel = function(klass, text, pos) {
        html = '<div style="position:absolute;" class="label ' + klass + '">' + text + "</div>";
        $(html).css(pos).appendTo( plot.target );        
      }

      addLabel('bar-label', optionResolver(options.barLabel), {
        left: tX(x - 0.5),
        bottom: plot.height - tY(lastY),
        width: tX(1)
      });
      addLabel('axis-label', optionResolver(options.axisLabel), {
        left: tX(x - 0.5),
        top: tY(0),
        width: tX(1)
      });
    }
  }

  function sum(a) {
    var total = 0;
    $.each(a, function() {
      total += this;
    });
    return total;
  }

  function makeAxis(options) {
    var axis = {
      x: {},
      y: {}
    }

    axis.x.min = 0
    axis.x.max = options.data.length;
    axis.y.min = 0;
    axis.y.max = 0;

    for (var i = 0; i < options.data.length; ++i) {
      element = options.data[i];
      var y = element[0]; // TODO: Support non-array y values
      if (y.length)
        y = sum(y);
      if( y < axis.y.min )      throw("Negative values not supported");
      if( y > axis.y.max )      axis.y.max = y;
    }
    
    if( axis.x.max <= 0) throw("You must have at least one data point");
    if( axis.y.max <= 0) throw("You must have at least one y-value greater than 0");

    return axis;
  }

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
    canvas = $('<canvas width="' + plot.width + '" height="' + plot.height + '"></canvas>').appendTo( target ).get( 0 );
    if( $.browser.msie ) { canvas = window.G_vmlCanvasManager.initElement( canvas ); }
    plot.ctx = canvas.getContext( '2d' );

    plot.axis = makeAxis(options);

    return plot;
  }
} )( jQuery );
