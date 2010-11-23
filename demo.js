var fs = require("fs");
var http = require("http");

var client = http.createClient(8000, "127.0.0.1");

fs.readdir("./jscrap", function (err, files) {
    if (err) throw err;
    files.map(function (file) {
        if (file.match(/\.js$/)) {
            var data = fs.readFile("./jscrap/" + file, function (err, content) {
                if (err) throw err;
                var request = client.request('POST', '/');
                request.end(content).on("response", function (response) {
                    var data = "";
                    response.on("data", function (chunk) { data += chunk; });
                    response.on("end", function () {
                        var errors = JSON.parse(data);
                        console.log(errors.length + " " + file);
                    });
                });
            });
        }
    });
});

