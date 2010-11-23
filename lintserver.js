var dns = require('dns');
var fs = require('fs');
var http = require('http');
var path = require('path');
var sys = require('sys');
var Script = process.binding('evals').Script;

var LintServer = (function () {
    var JSLINT;
    
    function updateJSLint(then) {
        sys.print('Updating JSLint... ');
        dns.resolve4('www.jslint.com', function (err, addresses) {
            if (err) {
                console.log('\nError ' + err.errno + ': ' + err.message);
                switch (err.errno) {
                    case 11:
                        console.log('TODO: message about setting up DNS in Windows');
                }
                process.exit(err.errno);
            } else {
                var request = http.createClient(80, 'www.jslint.com').request('GET', '/fulljslint.js', { 'Host': 'www.jslint.com' });
                request.end();
                request.on('response', function (response) {
                    var data = '';
                    response.setEncoding('utf8');
                    response.on('data', function (chunk) {
                        data += chunk;
                    });
                    response.on('end', function () {
                        data += '\nexports.JSLINT = JSLINT;' // to make a module
                        fs.writeFileSync('./fulljslint.js', data);
                        console.log('done!');
                        then();
                    });
                });
            }
        });
    }
    
    function checkJSLint(then) {
        path.exists('./fulljslint.js', function (exists) {
            if (exists) {
                then();
            } else {
                updateJSLint(then);
            }
        });
    }
    
    function loadJSLint() {
        JSLINT = require('./fulljslint').JSLINT;
        console.log("Loaded JSLINT " + JSLINT.edition);
    }
    
    function init() {
        checkJSLint(loadJSLint);
        return this;
    }
    
    function start(port) {
        http.createServer(function (req, res) {
            sys.print('Linting... ');
            var data = '';
            req.on('data', function (chunk) { data += chunk; });
            req.on('end', function () {
                JSLINT(data, { white: true, browser: true, devel: true, undef: true, nomen: true, eqeqeq: true, plusplus: true, bitwise: true, regexp: true, newcap: true, immed: true, maxerr: 99999999, indent: 2 });
                //console.dir(JSLINT.errors);
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.write(JSON.stringify(JSLINT.errors));
                res.end('\n');
                console.log('done!');
            });
        }).listen(port);
        console.log('LintServer listening on port ' + port);
    }
    
    return {
        init: init,
        start: start
    }
})();;

LintServer.init().start(8000); //TODO: starts server before init complete, fix that