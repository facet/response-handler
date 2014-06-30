var _ = require('underscore');

/** 
 * ResponseHanlder constructor
 *
 * @param   object  options  must contain 'intercom' (EventEmitter instance) key
 *
 * @return void
 */
var ResponseHandler = function( options ) {
  this.intercom = options.intercom;

  this._res = null;
  this._req = null;
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

  // register event listeners
  this.registerEvents();
};


/** 
 * Registers listener for response events. Will
 * respond to facet:response:* events
 *
 * @return void
 */
ResponseHandler.prototype.registerEvents = function() {
  var _this = this;
  
  this.intercom.on('facet:response:**', function responseCatchAll() {
    console.log('event in response handler: ', this.event);

    if( this.event === 'facet:response:error' ) {
      _this.errorController.apply(_this, arguments);
    }
    else {
      _this.responseController.apply(_this, arguments);
    }
  })
};


/** 
 * Returns an express style middleware function that must be use()'d
 * in order to initialize the ResponseHandler
 *
 * @return function
 */
ResponseHandler.prototype.listen = function() {
  var _this = this;

  return function responseListener(req, res, next) {
    _this._res = res;
    _this._req = req;

    if( _.isFunction(next) ) {
      next();
    }
  };
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
ResponseHandler.prototype.errorController = function(status, message, headers) {
  var data = {
    message: message
  };

  var options = {
    status: status
  };

  this.responseController(data, options, headers);
};



/** 
 * Controls the flow of setting headers, response body, and firing events
 * for other libraries to hook into. The following events are fired:
 *    - facet:_response:flushheaders:start
 *    - facet:_response:flushheaders:end
 *    - facet:_response:write:start
 *    - facet:_response:write:end
 *    - facet:_response:end
 * 
 * TODO: break this into smaller functions to and allow chaining + streaming
 * 
 * @return void
 */
ResponseHandler.prototype.responseController = function(data, options, headers) {

  console.log('data in responseController: ', data);

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

  // fire hook for pre sending headers
  // this.intercom.emit('facet:_response:flushheaders:start');

  // flush headers
  this._res.writeHead(options.status, headers);

  this._flushedHeaders = true;

  // set up hook for post sending headers
  // this.intercom.emit('facet:_response:flushheaders:end');

  // fire hook for pre writing response
  // this.intercom.emit('facet:_response:write:start');

  // write response
  this._res.write(JSON.stringify(data), options.encoding);

  // fire hook for post sending headers
  // this.intercom.emit('facet:_response:write:end');

  // fire hook for ending response
  // this.intercom.emit('facet:_response:end');

  // end response
  this._res.end();
};



exports = module.exports = ResponseHandler;
