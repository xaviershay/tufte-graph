(function ( $ ) {
  $.collect = function(enumerable, callback) {
    validateCallback(callback);

    var result = [];
    $.each(enumerable, function (index) {
      result.push(callback.call(this, index));
    });
    return result;
  }

  $.fn.collect = function(callback) {
    return $.collect(this, callback);
  }

  $.inject = function(enumerable, initialValue, callback) {
    validateCallback(callback);

    var accumulator = initialValue;

    $.each(enumerable, function (index) {
      accumulator = callback.call(this, accumulator, index);
    });
    return accumulator;
  }

  $.fn.inject = function(initialValue, callback) {
    return $.inject(this, initialValue, callback);
  }

  $.sum = function(enumerable) {
    return $.inject(enumerable, 0, function(accumulator) {
      return accumulator + this;
    });
  }

  $.fn.sum = function() {
    return $.sum(this);
  }

  // Private methods
  function validateCallback(callback) {
    if (!jQuery.isFunction(callback))
      throw("callback needs to be a function, it was: " + callback);
  }
})( jQuery );
