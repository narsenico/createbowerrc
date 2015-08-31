var fs = require('fs');
var process = require('process');

var KEYS = /^(https\-proxy|proxy)=(.*)/;

function getUserHome() {
    return process.env[(process.platform == 'win32') ? 'USERPROFILE' : 'HOME'];
}

exports.create = function(path) {
    fs.readFile(path || (getUserHome() + '/.npmrc'), 'utf8', function(err, data) {
        if (err) {
            console.log(err);
        } else {
            fs.open('./.bowerrc', 'w', function writeFs(err, fd) {
                if (err) {
                    console.log(err);
                } else {
                	var rout = [];
                    var rows = data.split(/[\r\n]/)
                    for (var ii = 0; ii < rows.length; ii++) {
                    	var tokens = KEYS.exec(rows[ii]);
                    	if (tokens && tokens.length == 3) {
                    		rout.push('"' + tokens[1] + '": "' + tokens[2] + '"');
                    	}
                    }
                    fs.write(fd, '{' + rout.join(', ') + '}', 0, 'utf8');
                }
            });
        }
    });
};
