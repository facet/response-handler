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

  this._res = this.intercom._res;
  this._req = this.intercom._req;
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

    // console.log('lets see if it worked....');
    // console.log(_this._req.apiUser);
    // console.log(_this._req.test);


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
 * Controls the flow of setting headers and response body then ends response
 * 
 * TODO: break this into smaller functions to and allow chaining + streaming
 * 
 * @return void
 */
ResponseHandler.prototype.responseController = function(data, options, headers) {

  // console.log('data in responseController: ', data);

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
  this._res.writeHead(options.status, headers);
  this._flushedHeaders = true;

  // write response
  this._res.write(JSON.stringify(data), options.encoding);

  // end response
  this._res.end();
};



exports = module.exports = ResponseHandler;
