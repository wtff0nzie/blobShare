/***************************************************
*                      BlobShare
****************************************************
*
*   About:  Allow blobs to grow.
*
****************************************************/
var port = process.env.PORT || process.env.port || 8081,
    eventEmitter = require('events');


// Global event emitter
EVENTS = new eventEmitter.EventEmitter();


// Import
require('./app/router.js');
require('./app/blobShare.js');


// Listen for HTTP requests
require('http').createServer(function (req, res) {
    EVENTS.emit('hit', {
        req                 : req,
        res                 : res,
        requestStarted      : Date.now(),
        httpStatus          : 200,
        httpHeaderSent      : false
    });
}).listen(port);

console.log('BlobShare listening on port ' + port);