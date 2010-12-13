/*jslint devel: true */
/*global require, process */

var assert = require('assert');
var dns = require('dns');
var fs = require('fs');
var http = require('http');
var path = require('path');
var sys = require('sys');
var url = require('url');
var vm = process.binding('evals').Script; // change to require('vm') when 0.2 support is dropped

var lintserver = (function () {
    var JSLINT,
        port = 8000,
        defaults = { // default options are The Good Parts extended with higher maxerr
            white: true,
            onevar: true,
            undef: true,
            nomen: true,
            eqeqeq: true,
            plusplus: true,
            bitwise: true,
            regexp: true,
            newcap: true,
            immed: true,
            maxerr: 10000
        },
        options;
    
    function doIndex(req, res) {
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end('TODO: LintServer index page\n');
    }
    
    function doLint(req, res) {
        var data = '';
        req.on('data', function (chunk) {
            data += chunk;
        });
        req.on('end', function () {
            sys.print('Linting... ');
            var begin = Date.now();
            JSLINT(data, Object.create(options)); // cloning options because JSLINT leaks back options from linted file
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(JSLINT.errors) + '\n');
            console.log('done in ' + (Date.now() - begin) + ' ms!');
        });
    }
    
    function doUpdate(req, res) {
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end('TODO: LintServer update page\n');
    }
    
    function start() {
        http.createServer(function (req, res) {
            req.url = url.parse(req.url);
            switch (req.url.pathname) {
            case '/lint':
                doLint(req, res);
                break;
            case '/update':
                doUpdate(req, res);
                break;
            default:
                doIndex(req, res);
            }
        }).listen(port);
        console.log('LintServer listening on port ' + port);
    }
    
    function setOptions(l_options) {
        var option;
        options = Object.create(defaults);
        if (l_options) {
            for (option in l_options) {
                if (l_options.hasOwnProperty(option)) {
                    options[option] = l_options[option];
                }
            }
        }
    }
    
    function loadJSLint() {
        var sandbox = {};
        vm.runInNewContext(fs.readFileSync('./fulljslint.js', 'utf8'), sandbox, 'fulljslint.js');
        JSLINT = sandbox.JSLINT;
        console.log("Loaded JSLint " + JSLINT.edition);
        setOptions(); // set default options
        start();
    }
    
    function updateJSLint(then) {
        sys.print('Updating JSLint... ');
        dns.resolve4('www.jslint.com', function (err, addresses) {
            if (err) {
                console.log('\nError ' + err.errno + ': ' + err.message);
                if (err.errno === 11) {
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
    
    function init(l_port) {
        if (l_port) {
            port = l_port;
        }
        checkJSLint(loadJSLint);
    }
    
    return init;
}());

lintserver();