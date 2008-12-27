( function( $ ) {
  function TufteBar( target_, options_ ) {
    var target = target_;
    var options = $.extend(true, {
      barWidth: 0.8,
      color:      function(element, index) { return '#476fb2'; },
      barLabel:  function(element, index) { return element[0]; },
      axisLabel: function(element, index) { return index; }
    }, options_);
    var ctx = null;
    var plot = {};

    var axis = calculateRange(options);

    constructCanvas();
    draw(target, options);

function draw(target, options) {
  for (var i = 0; i < options.data.length; ++i) {
    element = options.data[i];

    var x = i + 0.5,
        y = element[0],
        drawLeft = true,
        drawTop = true,
        drawRight = true;

    // determine the co-ordinates of the bar, account for negative bars having
    // flipped top/bottom and draw/don't draw accordingly
    var halfBar = options.barWidth / 2;
    var left   = x - halfBar,
        right  = x + halfBar,
        bottom = 0,
        top    = y;

    ctx.save();
    ctx.fillStyle = options.color(element, i);
    ctx.beginPath();
    ctx.moveTo( tX( left ), tY( bottom) );
    ctx.lineTo( tX( left ), tY( top) );
    ctx.lineTo( tX( right ), tY( top) );
    ctx.lineTo( tX( right ), tY( bottom) );
    ctx.fill();
    ctx.restore();

    addLabel('bar-label', options.barLabel(element, i), {
      left: tX(x - 0.5),
      bottom: plot.height - tY(top),
      width: tX(1)
    });
    addLabel('axis-label', options.axisLabel(element, i), {
      left: tX(x - 0.5),
      top: tY(bottom),
      width: tX(1)
    });
  }
}

function addLabel(klass, text, pos) {
  html = '<div style="position:absolute;" class="label ' + klass + '">' + text + "</div>";
  $(html).css(pos).appendTo( target );        
}

function tX( x ) { return               ( x - axis.x.min ) * (plot.width  / (axis.x.max - axis.x.min)); }
function tY( y ) { return plot.height - ( y - axis.y.min ) * (plot.height / (axis.y.max - axis.y.min)); }

function constructCanvas() {
  plot.width = target.width();
  plot.height = target.height();
  target.html( '' ).css( 'position', 'relative' );

  if( plot.width <= 0 || plot.height <= 0 ) {
      throw "Invalid dimensions for plot, width = " + plot.width + ", height = " + plot.height;
  }

  // the canvas
  canvas = $('<canvas width="' + plot.width + '" height="' + plot.height + '"></canvas>').appendTo( target ).get( 0 );
  if( $.browser.msie ) { canvas = window.G_vmlCanvasManager.initElement( canvas ); }
  ctx = canvas.getContext( '2d' );
}

function calculateRange(options) {
  var top_sentry    = Number.POSITIVE_INFINITY,
      bottom_sentry = Number.NEGATIVE_INFINITY;

  var axis = {
    x: {},
    y: {}
  }

  axis.x.datamin = axis.y.datamin = 0;
  axis.y.datamax = axis.y.datamax = bottom_sentry;

  for (var i = 0; i < options.data.length; ++i) {
    element = options.data[i];
    var y = element[0]; // TODO: Support non-array y values
    if( y < axis.y.datamin )      throw("Negative values not supported");
    if( y > axis.y.datamax )      axis.y.datamax = y;
  }

  axis.x.datamax = options.data.length;
  
  if( axis.x.datamin == top_sentry )           axis.x.datamin = 0;
  if( axis.y.datamin == top_sentry )           axis.y.datamin = 0;
  if( axis.x.datamax == bottom_sentry )        axis.x.datamax = 1;
  if( axis.y.datamax == bottom_sentry )        axis.y.datamax = 1;
  axis.x.min = axis.x.datamin;
  axis.x.max = axis.x.datamax;
  axis.y.min = axis.y.datamin;
  axis.y.max = axis.y.datamax;

  return axis;
}
  }

  $.tufteBar = function( target, data ) {
    var plot = new TufteBar( target, data );
    return plot;
  }
} )( jQuery );
