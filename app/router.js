/***************************************************
 *                      Router
 ****************************************************
 *
 *   About:  Route collection and direction.
 *
 ****************************************************/
'use strict';

var fileServer = require('simpl3s'),
    url = require('url'),
    ready = false,
    routes = {};


// Respond to a 'hit', discover URL and route accordingly
var routeRequest = function (payload) {
    var req = payload.req,
        reqPath = url.parse(req.url).pathname,
        route = routes[reqPath];


    // Deal with a route request
    var handleRequest = function (route, params) {
        if (typeof route.func === 'String') {
            serveStaticFile(route.func);
        } else {
            route.func(payload, params);
        }

        if (route.evt) {
            EVENTS.emit(route.evt, payload, params);
        }
    };


    // Static file request, serve it
    var serveStaticFile = function (url) {
        if (url) {
            payload.req.url = url;
        }

        fileServer.serveFile(payload.req, payload.res);
    };


    // Discover if request is a partial, discover arguments and trigger
    var handlePartial = function () {
        var foundPartial = false,
            params = {},
            partial;

        Object.keys(routes).some(function (item) {
            var keys = item.split(':'),
                routeLen,
                args;

            if (! Array.isArray(keys)) {
                return;
            }

            routeLen = keys[0].length;

            if (reqPath.substr(0, routeLen) === keys[0] || (keys[0].slice(-1) === '/' && reqPath.substr(0, routeLen) === keys[0].substr(0, routeLen -1))) {
                args = reqPath.substr(keys[0].length).split('/');
                keys.shift();

                keys.forEach(function (key, index) {
                    if (args[index]) {
                        params[key.replace('/', '')] = args[index];
                    }
                });

                partial = routes[item];
                foundPartial = true;
            }
            return foundPartial;
        });

        if (foundPartial) {
            handleRequest(partial, params);
            return;
        }

        // No match, fall back to 404
        serveStaticFile('/404.html');
        EVENTS.emit('error404', payload);
    };


    // Handle routing requests as quickly as possible
    if (reqPath === '/' && !route) {
        serveStaticFile('/index.html');
    } else if (route) {
        handleRequest(route);
    } else if (reqPath.substr(0, 6) === '/media') {
        serveStaticFile(reqPath);
    } else {
        handlePartial();
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
        evt : evt || null,
        func: func || uri
    };
};


// List all current routes
var listRoutes = function () {
    return JSON.parse(JSON.stringify(routes));
};


// Trigger a route
var triggerRoute = function (payload, url) {
    payload.req.url = url;
    routeRequest(payload);
};


// Invite route addition and respond to hits
var initRouter = function () {
    if (ready) {
        return;
    }

    EVENTS.emit('buildRoutes', buildRoute);
    EVENTS.on('addRouteEvent', addEvent);
    EVENTS.on('listRoutes', listRoutes);
    EVENTS.on('eventedHit', triggerRoute);
    EVENTS.on('hit', routeRequest);

    ready = true;
};


// Public API (events preferred)
module.exports = {
    addEvent    : addEvent,
    addRoute    : buildRoute,
    list        : listRoutes,
    route       : routeRequest,
    trigger     : triggerRoute
};


// Listen for application ready events, with timer fallback
EVENTS.on('DBReady', initRouter);
setTimeout(initRouter, 999);