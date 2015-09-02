/* createbowerrc
 * ver. 0.0.1
 * by narsenico
 *
 * args: 
 * -d|--directory <path>
 * -s|--ssl <true|false>
 * -p|--proxy <proxy> (set https-proxy also)
 * -n!--npmrc (load proxy settings from .npmrc file)
 */
var fs = require('fs');
var process = require('process');
//regex per le chiavi inerenti al proxy 
var NPMRC_KEYS = /^(https\-proxy|proxy)=(.*)/;
//regex per gli argomenti da linea di comando
var ARG_DIRECTORY = /^\-(d|\-directory)$/;
var ARG_STRICTSSL = /^\-(s|\-ssl)$/;
var ARG_PROXY = /^\-(p|\-proxy)$/;
var ARG_NPMRC = /^\-(n|\-npmrc)$/;
var ARG_HELP = /^\-(h|\-help)$/;

function getUserHome() {
    return process.env[(process.platform == 'win32') ? 'USERPROFILE' : 'HOME'];
}

function parseArgv(argv) {
    var args = {};
    for (var ii = 2; ii < argv.length; ii++) {
        if (ARG_DIRECTORY.test(argv[ii])) {
            args["directory"] = argv[++ii];
        } else if (ARG_STRICTSSL.test(argv[ii])) {
            args["strict-ssl"] = (argv[++ii] === 'true');
        } else if (ARG_PROXY.test(argv[ii])) {
            args["proxy"] = argv[++ii];
        } else if (ARG_NPMRC.test(argv[ii])) {
            args["npmrc"] = true;
        } else if (ARG_HELP.test(argv[ii])) {
            return 'help';
        }
    }
    return args;
}

function writeOut(oout, cb) {
    //se gia' presente il file verra' sostituito
    var path = './.bowerrc';
    fs.open(path, 'w', function writeFs(err, fd) {
        if (err) {
            cb(err);
        } else {
            fs.write(fd, JSON.stringify(oout), 0, 'utf8', function writecb(err, written, string) {
                if (err) {
                    cb(err);
                } else {
                    cb(null);
                }
            });
        }
    });
}

function printHelp() {
    console.log(
        "Usage:\n" +
        "    createbowerrc [<options>]\n\n" +
        "Options:\n" +
        "    -h, --help                This help.\n" +
        "    -d, --directory <path>    The path in which installed components should be\n" +
        "                              saved. If not specified this defaults to\n" +
        "                              bower_components.\n" +
        "    -p, --proxy <url>         The proxy to use for http requests.\n" +
        "    -s, --ssl <true|false>    Whether or not to do SSL key validation when\n" +
        "                              making requests via https.\n" +
        "    -n, --npmrc               Load config from .npmrc file.\n"
    );
}

function end(err) {
    if (err) {
        throw err;
    } else {
        console.log('.bowerrc created in current folder');
    }
}

function exec() {
    var args = parseArgv(process.argv);
    return create(args);
}

function create(args) {
    if (args === 'help') {
        printHelp();
    } else if (args) {
        var oout = {};
        //parametri da riga di comando
        if (args["directory"]) {
            oout["directory"] = args["directory"];
        }
        if (args["strict-ssl"]) {
            oout["strict-ssl"] = args["strict-ssl"];
        }
        if (args["proxy"]) {
            oout["proxy"] = oout["https-proxy"] = args["proxy"];
        }
        if (args["npmrc"]) {
            var npmrcPath = getUserHome() + '/.npmrc';
            fs.readFile(npmrcPath, 'utf8', function readcb(err, data) {
                if (err) {
                    console.log('There was an error reading "' + npmrcPath + '" file.', '\n', err);
                } else {
                    var rows = data.split(/[\r\n]/)
                    for (var ii = 0; ii < rows.length; ii++) {
                        var tokens = NPMRC_KEYS.exec(rows[ii]);
                        if (tokens && tokens.length == 3) {
                            oout[tokens[1]] = tokens[2];
                        }
                    }
                    writeOut(oout, end);
                }
            });
        } else {
            writeOut(oout, end);
        }
    }
}

exports.exec = exec;
exports.create = create;