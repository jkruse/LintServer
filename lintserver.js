var http = require("http");
var fs = require("fs");
var Script = process.binding("evals").Script;

var Linter = {};
var lintContent = fs.readFileSync("./fulljslint.js");
Script.runInNewContext(lintContent, Linter, "fulljslint.js");
var JSLINT = Linter.JSLINT;

//var data = fs.readFileSync("lintserver.js");
//    console.log(data.toString());

http.createServer(function (req, res) {
    var data = "";
    req.on("data", function (chunk) { data += chunk; });
    req.on("end", function () {
        JSLINT(data, { white: true, browser: true, devel: true, undef: true, nomen: true, eqeqeq: true, plusplus: true, bitwise: true, regexp: true, newcap: true, immed: true, maxerr: 99999999, indent: 2 });
        //console.dir(JSLINT.errors);
        res.writeHead(200, { "Content-Type": "application/json" });
        res.write(JSON.stringify(JSLINT.errors));
        res.end("\n");
    });
}).listen(8000);