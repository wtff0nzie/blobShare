/***************************************************
 *                      Router
 ****************************************************
 *
 *   About:  Routes collection and direction.
 *
 ****************************************************/
var fileServer = require('simpl3s'),
    url = require('url'),
    routes = {};


// Respond to a 'hit', discover URL and route accordingly
var routeRequest = function (payload) {
    var req = payload.req,
        reqPath = url.parse(req.url).pathname,
        route = routes[reqPath];


    // Fling out a static file
    var serveStaticFile = function (uri) {
        if (uri) {
            payload.req.url = uri;
        }

        fileServer.serveFile(payload.req, payload.res);
    };


    // Dig into a partial hit
    var handlePartial = function (uri) {
        console.log('TODO: handle partial calls');
    };


    // Handle routing requests as quickly as possible
    if (reqPath === '/') {
        serveStaticFile('/index.html');
    } else if (route) {
        if (typeof route.func === 'String') {
            serveStaticFile();
        } else {
            route.func(payload);
        }

        if (route.evt) {
            EVENTS.emit(route.evt, payload);
        }
    } else if (reqPath.substr(0, 6) === '/media') {
        serveStaticFile();
    } else if (reqPath.substr(0, 4) === '/api') {
        EVENTS.emit('blobShare', payload); // TMP
    } else {
        EVENTS.emit('blobShare', payload);
    }
};


// Add global events for routes
var addEvent = function (uri, evt) {
    if (!routes[uri]) {
        routes[uri] = {
            func: uri
        };
    }

    routes[uri].evt = evt;
};


// Add routes from across application
var buildRoute = function (uri, func, evt) {
    routes[uri] = {
        evt: evt || null,
        func: func || uri
    };
};


// Allow app to init, then ask for routes TODO: Event this
setTimeout(function () {
    EVENTS.emit('buildRoutes', buildRoute);
    EVENTS.on('addRouteEvent', addEvent);
    EVENTS.on('hit', routeRequest);
}, 500);


// Public API (events preferred)
module.export = {
    addEvent    : addEvent,
    addRoute    : buildRoute,
    route       : routeRequest
};