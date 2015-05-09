/***************************************************
*                      BlobShare
****************************************************
*
*   About:  Grow your blob... grow it good!
*
****************************************************/
'use strict';

var formHandler = require('formidable'),
    uuid = require('node-uuid'),
    mongo = require('mongojs'),
    objectId = mongo.ObjectId,
    DBcreds = process.env.DB,
    DBcollection = ['blobs'],
    gZip = require('zlib'),
    url = require('url'),
    DB;



if (!DBcreds) {
    console.log('Error; please specifiy database details. Quitting.');
    return;
}


// Fire up DB
DB = mongo.connect('mongodb://' + DBcreds, DBcollection);
DB.blobs.ensureIndex('name');


// Optimise static assets
if (!process.env.dev) {
    require('simpl3s').speedify('./public');
}


// Can request be gzipped?
var acceptGzip = function (request) {
    var acceptEncoding = request.headers['accept-encoding'] || '';

    if (acceptEncoding.match(/\bdeflate\b/)) {
        return 'deflate';
    } else if (acceptEncoding.match(/\bgzip\b/)) {
        return 'gzip';
    }

    return false;
};


// Serve JSON
var serveJSON = function (payload, json) {
    var res = payload.res,
        status = payload.httpStatus || 200,
        headers,
        buffer;

    headers = {
        'Content-Type'                      : 'application/json',
        'Access-Control-Allow-Origin'       : '*',
        'Access-Control-Allow-Credentials'  : 'true',
        'Access-Control-Allow-Methods'      : 'DELETE, GET, OPTIONS, PATCH, POST, PUT',
        'Access-Control-Allow-Headers'      : 'Content-Type'
    };

    if (!json) {
        res.writeHead(404, headers);
        res.end('{"blob":"not found"}');
        return;
    }

    if (typeof json !== 'String') {
        json = JSON.stringify(json);
    }

    if (!acceptGzip(payload.req)) {
        res.writeHead(status, headers);
        res.end(json);
    } else {
        headers['Content-Encoding'] = 'gzip';

        res.writeHead(status, headers);

        buffer = new Buffer(json, 'utf-8');
        gZip.gzip(buffer, function (_, result) {                // TODO: stream
            res.end(result);
        });
    }
};


// Generate a blob
var genBlob = function (blobName, blob, nuBlob) {
    if (blob) {
        blob.updated = Date.now();
        blob.hits++;
    } else {
        blob = {
            created     : Date.now(),
            versions    : [],
            name        : blobName,
            hits        : 0
        }
    }

    if (nuBlob) {
        blob.versions.push(nuBlob);
    }

    return blob;
};


// Fetch a blob
var fetchBlob = function (blobName, callback) {
    DB.blobs.findOne({name: blobName}, callback);
};


// Update a blob...
var patchBlob = function (blobName, blob, payload) {
    fetchBlob(blobName, function (err, oldBlob) {
        var lastVersion;

        if (err || !oldBlob) {
            console.log('Blob does not exist');
            addBlob(blobName, blob, payload);
            return;
        }

        lastVersion = JSON.parse(JSON.stringify(oldBlob.versions[oldBlob.versions.length - 1]));

        Object.keys(blob).forEach(function (key) {
            lastVersion[key] = blob[key];
        });

        oldBlob.versions.push(lastVersion);
        blob.updated = Date.now();
        DB.blobs.update({"name": blobName}, oldBlob);

        console.log('Patched ' + JSON.stringify(oldBlob));

        payload.httpStatus = 200;
        serveJSON(payload, {"msg":"updated"})
    });
};


// Read contents of a POST / PATCH
var readForm = function (payload, callback) {
    var form = new formHandler.IncomingForm();

    form.parse(payload.req, callback);
};


// Create a brand new blob
var addBlob = function (blobName, blob, payload) {
    var aBlob;

    if (typeof blob === 'String') {
        blob = JSON.stringify(blob);
    }

    aBlob = genBlob(blobName, null, blob);
    DB.blobs.insert(aBlob);

    payload.httpStatus = 201;
    serveJSON(payload, {"msg":"created"})

    console.log('Created ' + JSON.stringify(aBlob));
};


// Get rid of a blob
var deleteBlob = function (blobName, payload) {
    console.log('Deleting ' + blobName);

    DB.blobs.remove({"name":blobName});
    serveJSON(payload, {"msg":"All blobs go to heaven"});
};


// Serve a blob
var serveBlob = function (blobName, payload) {

    // Prepare a blob to be served
    var prepBlob = function (err, blob) {
        var serveVersion;

        console.log(JSON.stringify(blob));

        if (err || !blob) {
            payload.httpStatus = 404;
        } else {
            if (!blob.versions || blob.versions.length < 1) {
                serveVersion = null;
            } else {
                serveVersion = blob.versions[blob.versions.length - 1];
            }
        }

        serveJSON(payload, serveVersion);
        DB.blobs.update({"name": blobName}, {$inc:{hits:1}});
    };

    // Grab blob from DB
    fetchBlob(blobName, prepBlob);
};


// Handle blob request
var handleBlob = function (payload) {
    var req = payload.req,
        method = req.method.toUpperCase(),
        blobName = url.parse(req.url).pathname.substr(1);


    switch (method) {

        case 'GET':
            serveBlob(blobName, payload)
            break;

        case 'PATCH':
            readForm(payload, function (err, data) {
                patchBlob(blobName, data, payload);
            });
            break;

        case 'DELETE':
            deleteBlob(blobName, payload);
            break;

        case 'POST':
        case 'PUT':
            readForm(payload, function (err, data) {
                addBlob(blobName, data, payload);
            });
            break;

        case 'OPTIONS':
            serveJSON(payload, {'cors':true});
            break;
    };
};


// Public API
EVENTS.on('blobShare', handleBlob);


// Listen for requests
EVENTS.on('buildRoutes', function (func) {
    func('/:blob', handleBlob);
});


// Broadcast DB state
setTimeout(function () {
    EVENTS.emit('DBReady');
}, 99);