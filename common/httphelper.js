/****************************************************************************
 The MIT License (MIT)

 Copyright (c) 2013 Apigee Corporation

 Permission is hereby granted, free of charge, to any person obtaining a copy
 of this software and associated documentation files (the "Software"), to deal
 in the Software without restriction, including without limitation the rights
 to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 copies of the Software, and to permit persons to whom the Software is
 furnished to do so, subject to the following conditions:

 The above copyright notice and this permission notice shall be included in
 all copies or substantial portions of the Software.

 THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 THE SOFTWARE.
 ****************************************************************************/
"use strict";

var assert = require('assert');
var http = require('http');
var query = require('querystring');
var url = require('url');

module.exports.waitForResponse = function(u, cb) {
  makeWaitRequest(u, cb);
};

function makeWaitRequest(u, cb) {
  var req = http.get(u, function(resp) {
    checkHealthResponse(u, resp, cb);
  });
  req.on('error', function(err) {
    setTimeout(function() {
      makeWaitRequest(u, cb);
    }, 1000);
  });
}

function checkHealthResponse(u, resp, cb) {
  if (resp.statusCode !== 404) {
    cb();
  } else {
    setTimeout(function() {
      makeWaitRequest(u, cb);
    }, 1000);
  }
}

module.exports.postFormGetJson = function(u, auth, body, cb) {
  var bo = query.stringify(body);
  var pu = url.parse(u);
  pu.method = 'POST';
  //console.log('%j: %j', pu, body);

  var req = http.request(pu, function(resp) {
    //console.log('Response: %d', resp.statusCode);
    var respStr = '';
    resp.setEncoding('utf8');
    resp.on('readable', function() {
      var chunk;
      do {
        chunk = resp.read();
        if (chunk) {
          respStr += chunk;
        }
      } while (chunk);
    });
    resp.on('end', function() {
      try {
        cb(resp, JSON.parse(respStr));
      } catch (err) {
        console.error('Error parsing response %s as JSON: %s', respStr, err);
        cb();
      }
    });
  });

  req.on('error', function(err) {
    console.error('Client error: %s', err);
    cb();
  });

  if (auth) {
    req.setHeader('Authorization', auth);
  }
  req.setHeader('Content-Type', 'application/x-www-form-urlencoded');
  req.end(bo);
};
