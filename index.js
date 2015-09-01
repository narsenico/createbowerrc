/* createbowerrc
 * ver. 0.0.1
 * by narsenico
 *
 * args: 
 * -d|-directory <path>
 */
var fs = require('fs');
var process = require('process');
//regex per le chiavi inerenti al proxy 
var KEYS = /^(https\-proxy|proxy)=(.*)/;
var ARG_DIRECTORY = /^\-(directory|d)$/;
var ARG_STRICTSSL = /^\-(s|ssl)$/;

function getUserHome() {
    return process.env[(process.platform == 'win32') ? 'USERPROFILE' : 'HOME'];
}

function parseArgv(argv) {
    var args = {};
    for (var ii=2; ii<argv.length; ii++) {
        if (ARG_DIRECTORY.test(argv[ii])) {
            args.directory = argv[++ii];
        } else if (ARG_STRICTSSL.test(argv[ii])) {
            args.strictssl = (argv[++ii] === 'true');
        }
    }
    return args;
}

exports.create = function() {
    var args = parseArgv(process.argv);
    console.log(args);

    //TODO scrivere nel file .bowerrc anche i parametri recuperati da riga di comando

    //leggo il contenuto del file di configurazione di npm
    //e recupero le impostazioni del proxy
    var path = getUserHome() + '/.npmrc';
    fs.readFile(path, 'utf8', function readcb(err, data) {
        if (err) {
            console.log('There was an error reading "' + path + '" file.', '\n', err);
        } else {
            //se gia' presente il file verra' sostituito
            path = './.bowerrc';
            fs.open(path, 'w', function writeFs(err, fd) {
                if (err) {
                    console.log('There was an error creating "' + path + '" file.', '\n', err);
                } else {
                	var rout = [];
                    var rows = data.split(/[\r\n]/)
                    for (var ii = 0; ii < rows.length; ii++) {
                    	var tokens = KEYS.exec(rows[ii]);
                    	if (tokens && tokens.length == 3) {
                    		rout.push('"' + tokens[1] + '": "' + tokens[2] + '"');
                    	}
                    }
                    fs.write(fd, '{' + rout.join(', ') + '}', 0, 'utf8', function writecb(err, written, string) {
                        if (err) {
                            console.log('There was an error writing "' + path + '" file.', '\n', err);
                        } else {
                            console.log('.bowerrc created in current folder');
                        }
                    });
                }
            });
        }
    });
};
