/* createbowerrc
 * ver. 0.1.0
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
var promptly = require('promptly');
var promptlySync = require('promptly-sync');
var chalk = require('chalk');
var highlight = require('cardinal').highlight;

//regex per le chiavi inerenti al proxy 
var NPMRC_KEYS = /^(https\-proxy|proxy|strict-ssl)=(true|false|(.*))/;
//regex per gli argomenti da linea di comando
var ARG_DIRECTORY = /^\-(d|\-directory)$/;
var ARG_STRICTSSL = /^\-(s|\-ssl)$/;
var ARG_PROXY = /^\-(p|\-proxy)$/;
var ARG_NPMRC = /^\-(n|\-npmrc)$/;
var ARG_HELP = /^\-(h|\-help)$/;
//
var FIELD_STRICTSSL = 'strict-ssl';
var FIELD_DIRECTORY = 'directory';
var FIELD_PROXY = 'proxy';
var FIELD_HTTPSPROXY = 'https-proxy';
var FIELD_USENPMRC = 'usenpmrc';
var VER = '0.1.0';

// TODO considerare tutti i parametri -> https://github.com/bower/spec/blob/master/config.md

//default options
var defaults = {};

function getUserHome() {
    return process.env[(process.platform == 'win32') ? 'USERPROFILE' : 'HOME'];
}

function merge(obj1, obj2) {
    //creo un oggetto "vuoto"
    var merg = {};
    //inserisco le proprietà prelevandole dal primo oggetto
    if (obj1) {
        for (var pr1 in obj1) {
            merg[pr1] = obj1[pr1];
        }
    }
    //inserisco le proprietà prelevandole dal secondo oggetto
    //quelle già presenti verranno sostituite
    if (obj2) {
        for (var pr2 in obj2) {
            merg[pr2] = obj2[pr2];
        }
    }
    return merg;
}

function initDefaults() {
    defaults[FIELD_DIRECTORY] = '';
    defaults[FIELD_PROXY] = '';
    defaults[FIELD_HTTPSPROXY] = '';
    defaults[FIELD_STRICTSSL] = false;
    defaults[FIELD_USENPMRC] = false;
}

function askForArgs() {
    var questions = [{
        name: FIELD_DIRECTORY,
        type: 'prompt',
        default: defaults[FIELD_DIRECTORY],
        retry: false,
        description: 'Bower components path (eg: bower_components):'
    }, {
        name: FIELD_PROXY,
        type: 'prompt',
        default: defaults[FIELD_PROXY],
        retry: false,
        description: 'The proxy to use for http requests:'
    }, {
        name: FIELD_HTTPSPROXY,
        type: 'prompt',
        default: defaults[FIELD_HTTPSPROXY],
        retry: false,
        description: 'The proxy to use for https requests:'
    }, {
        name: FIELD_STRICTSSL,
        type: 'confirm',
        default: defaults[FIELD_STRICTSSL] ? 'y' : 'n',
        description: 'Use strict-ssl for requests via https? (y|N)'
    }, {
        name: FIELD_USENPMRC,
        type: 'confirm',
        default: defaults[FIELD_USENPMRC] ? 'y' : 'n',
        description: 'Import proxy settings from .npmrc file? (y|N)'
    }];
    promptlySync(questions, function(err, result) {
        if (err) {
            throw err;
        } else {
            create(result);
        }
    });
}

function parseArgv(args) {
    //TODO provare nopt
    var obj = {}; //TODO merge?
    for (var ii = 0; ii < args.length; ii++) {
        if (ARG_DIRECTORY.test(args[ii])) {
            obj[FIELD_DIRECTORY] = args[++ii];
        } else if (ARG_STRICTSSL.test(args[ii])) {
            obj[FIELD_STRICTSSL] = (/true|y|yes/i.test(args[++ii]));
        } else if (ARG_PROXY.test(args[ii])) {
            obj[FIELD_PROXY] = obj[FIELD_HTTPSPROXY] = args[++ii];
        } else if (ARG_NPMRC.test(args[ii])) {
            obj[FIELD_USENPMRC] = true;
        } else if (ARG_HELP.test(args[ii])) {
            printHelp();
            return;
        }
    }
    create(obj);
}

function printHelp() {
    console.log(
        // "Ver. " + VER + "\n" +
        "Usage:\n\n" +
        "    " + chalk.cyan("createbowerrc") + " <options>\n\n" +
        "Options:\n\n" +
        "    " + chalk.yellow("-h, --help") + "                This help.\n" +
        "    " + chalk.yellow("-d, --directory") + " <path>    The path in which installed components should be\n" +
        "                              saved. If not specified this defaults to\n" +
        "                              bower_components.\n" +
        "    " + chalk.yellow("-p, --proxy") + " <url>         The proxy to use for http requests.\n" +
        "    " + chalk.yellow("-s, --ssl") + " <true|false>    Whether or not to do SSL key validation when\n" +
        "                              making requests via https.\n" +
        "    " + chalk.yellow("-n, --npmrc") + "               Load config from .npmrc file.\n"
    );
}

function exec() {
    initDefaults();
    if (process.argv && process.argv.length > 2) {
        parseArgv(process.argv.slice(2));
    } else {
        askForArgs();
    }
}

function create(options) {
    if (options[FIELD_USENPMRC] === true) {
        //recupero le informazioni sul proxy da .npmrc
        var npmrcPath = getUserHome() + '/.npmrc';
        fs.readFile(npmrcPath, 'utf8', function readcb(err, data) {
            if (err) {
                console.log('There was an error reading "' + npmrcPath + '" file.', '\n', err);
            } else {
                var rows = data.split(/[\r\n]/);
                for (var ii = 0; ii < rows.length; ii++) {
                    var tokens = NPMRC_KEYS.exec(rows[ii]);
                    //console.log('---', tokens[0]);
                    //1: field, 2: true|false, 3: string
                    if (tokens && tokens.length >= 3) {
                        options[tokens[1]] = (tokens[3] || (tokens[2] == 'true'));
                    }
                }
                writeOut(options, writeEnd);
            }
        });
    } else {
        writeOut(options, writeEnd);
    }
}

function writeOut(obj, cb) {
    //i parametri vuoti vengono esclusi
    var str = JSON.stringify(obj, function(key, value) {
        if (key != FIELD_USENPMRC && !(/^\s*$/.test(value))) return value;
        else return undefined;
    }, 4);
    //chiedo conferma all'utente
    console.log('\n', highlight(str, {json:true}), '\n');
    promptly.confirm('Looks good? (Y|n)', {
        default: 'y'
    }, function(err, value) {
        if (value) {
            //se gia' presente il file verra' sostituito
            var path = './.bowerrc';
            fs.open(path, 'w', function writeFs(err, fd) {
                if (err) {
                    cb(err);
                } else {
                    fs.write(fd, str, 0, 'utf8', function writecb(err, written, string) {
                        if (err) {
                            cb(err);
                        } else {
                            cb(null);
                        }
                    });
                }
            });
        }
    });
}

function writeEnd(err) {
    if (err) {
        throw err;
    } else {
        console.log('\n', chalk.cyan('.bowerrc created in current folder'));
    }
}

exports.exec = exec;
exports.help = printHelp;
exports.create = create;