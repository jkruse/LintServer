/*jslint devel: true */
/*global require */

var fs = require("fs");
var http = require("http");
var sys = require("sys");

var client = http.createClient(8000, "127.0.0.1");

function spaces(count) {
    var temp = [];
    temp.length = count + 1;
    return temp.join(' ');
}

fs.readdir(".", function (err, files) {
    if (err) {
        throw err;
    }
    files.map(function (file) {
        if (file.match(/\.js$/)) {
            var data = fs.readFile("./" + file, function (err, content) {
                if (err) {
                    throw err;
                }
                var request = client.request('POST', '/lint');
                request.end(content);
                request.on("response", function (response) {
                    var data = "";
                    response.on("data", function (chunk) {
                        data += chunk; 
                    });
                    response.on("end", function () {
                        var errors = JSON.parse(data);
                        if (errors.length > 0) {
                            console.log('%s (%d errors):', file, errors.length);
                            errors.map(function (error) {
                                if (error) {
                                    console.log('%s%d: %s', spaces(6 - String(error.line).length), error.line, error.evidence);
                                    console.log('%s^ %s', spaces(7 + error.character), error.reason);
                                }
                            });
                        } else {
                            console.log('%s OK!', file);
                        }
                    });
                });
            });
        }
    });
});

