/***************************************************
*                      BlobShare
****************************************************
*
*   About:  Grow your blob... grow it good!
*
****************************************************/
'use strict';

var mongo = require('mongojs'),
    DBcollection = ['blobs'],
    objectId = mongo.ObjectId,
    formHandler = require('formidable'),
    uuid = require('node-uuid'),
    url = require('url'),
    DB;

/*

if (!process.env.DB) {
    console.log('Error; please specifiy database details.');
}




//process.env.DBcreds
DB = mongo.connect('mongodb://' + dbUser, DBcollection);


// Just add to a blob...
var patchBlob = function (blob, callback) {

};


// Create a brand new blob
var createBlob = function () {

};


var handleBlob = function (payload) {
    console.log('Blob handling right here!');
};


// Public API
EVENTS.on('blobShare', handleBlob);
*/