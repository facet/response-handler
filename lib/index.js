var _ = require('underscore'),
  util = require('util'),
  ApiCore = require('facet-core').ApiCore;

/** 
 * ResponseHanlder constructor
 *
 * @param   object  options  must contain 'intercom' (EventEmitter instance) key
 *
 * @return void
 */
var ResponseHandler = function( options ) {
  
  // call the parent constructor
  ResponseHandler.super_.call(this, options);
  
  this._flushedHeaders = false;
  this._isError = false;

  // default response data
  this._defaults = {
    status: 200,
    encoding: 'utf8'
  };

  // default headers
  this._headers = {
    'content-type': 'application/json'
  };
};

util.inherits(ResponseHandler, ApiCore);


/** 
 * Returns an express style middleware function that must be use()'d
 * in order to initialize the ResponseHandler
 *
 * @return function
 */
// ResponseHandler.prototype.init = function() {
//   var _this = this;


//   return function responseListener(req, res, next) {
//     _this._res = res;
//     _this._req = req;

//     if( _.isFunction(next) ) {
//       next();
//     }
//   };
// };



/** 
 * Registers listener for response events. Will
 * respond to facet:response:* events
 *
 * @return void
 */
ResponseHandler.prototype.registerEvents = function() {
  var _this = this;
  
  this.intercom.on('facet:response:**', function responseCatchAll() {
    if( this.event === 'facet:response:error' ) {
      _this.errorController.apply(_this, arguments);
    }
    else {
      _this.responseController.apply(_this, arguments);
    }
  })
};


/** 
 * This is convenience function for responseController() that allows
 * a simpler API for emitting errors.
 *
 * @param   int     status    The http status code to send back. Ie 404 or 400
 * @param   string  message   A message to return in response body
 * @param   object  headers   Any http headers to send back w/ response
 *
 * @return void
 */
ResponseHandler.prototype.errorController = function(status, errors, headers) {
  var data = {
    status: status,
    errors: errors
  };

  var options = {
    status: status
  };

  this.responseController(data, options, headers);
};



/** 
 * Controls the flow of setting headers and response body then ends response
 * 
 * TODO: break this into smaller functions to and allow chaining + streaming
 * 
 * @return void
 */
ResponseHandler.prototype.responseController = function(data, options, headers) {
  if( _.isNumber(data) ) {
    var numRemoved = data;
    data = {message: numRemoved + ' item(s) affected.'}
  }

  if( typeof options === 'undefined' || typeof options !== 'object' ) {
    options = this._defaults;
  }
  else {
    _.defaults(options, this._defaults);
  } 

  if( typeof headers === 'undefined' || typeof headers !== 'object' ) {
    headers = this._headers;
  }
  else {
    _.defaults(headers, this._headers);
  }

  // flush headers
  this.nodeStack.res.writeHead(options.status, headers);
  this._flushedHeaders = true;

  // write response
  this.nodeStack.res.write(JSON.stringify(data), options.encoding);

  // end response
  this.nodeStack.res.end();

  // clear out the reference to the current req/res/next
  this.intercom.emit('facet:init:nodestack', {}, true);
};



exports = module.exports = ResponseHandler;
