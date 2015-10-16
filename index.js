/* createbowerrc
 * ver. 0.0.2
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
var promptly = require('promptly-sync');

//regex per le chiavi inerenti al proxy 
var NPMRC_KEYS = /^(https\-proxy|proxy)=(.*)/;
// //regex per gli argomenti da linea di comando
// var ARG_DIRECTORY = /^\-(d|\-directory)$/;
// var ARG_STRICTSSL = /^\-(s|\-ssl)$/;
// var ARG_PROXY = /^\-(p|\-proxy)$/;
// var ARG_NPMRC = /^\-(n|\-npmrc)$/;
// var ARG_HELP = /^\-(h|\-help)$/;
// var VER = '0.0.2';

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

function askForArgs() {
    var questions = [{
        name: 'usenpmrc',
        type: 'confirm',
        default: 'y',
        description: 'Import proxy settings from .npmrc file? [Y|n]'
    }, {
        name: 'directory',
        type: 'prompt',
        default: '',
        retry: false,
        description: 'Bower components path (eg: bower_components):'
    }, {
        name: 'proxy',
        type: 'prompt',
        default: '',
        retry: false,
        description: 'The proxy to use for http requests:'
    }, {
        name: 'https-proxy',
        type: 'prompt',
        default: '',
        retry: false,
        description: 'The proxy to use for https requests:'
    }, {
        name: 'strict-ssl',
        type: 'confirm',
        default: 'n',
        description: 'Use strict-ssl for requests via https? [y|N]'
    }];    
    promptly(questions, function(err, result) {
    	if (!err) {
        	create(result);
    	}
    });
}

function parseArgv() {
	//TODO
//     if (argv.length > 2) {
//         var args = {};
//         for (var ii = 2; ii < argv.length; ii++) {
//             if (ARG_DIRECTORY.test(argv[ii])) {
//                 args["directory"] = argv[++ii];
//             } else if (ARG_STRICTSSL.test(argv[ii])) {
//                 args["strict-ssl"] = (argv[++ii] === 'true');
//             } else if (ARG_PROXY.test(argv[ii])) {
//                 args["proxy"] = argv[++ii];
//             } else if (ARG_NPMRC.test(argv[ii])) {
//                 args["npmrc"] = true;
//             } else if (ARG_HELP.test(argv[ii])) {
//                 return 'help';
//             }
//         }
//         return args;
//     } else {
//         askArgs();
//         return false;
//     }	
}

function exec() {
	if (process.argv && process.argv.length > 2) {
		parseArgv();		
	} else {
		askForArgs();
	}
}

function create(options) {
	options = merge(defaults, options);
	if (options.usenpmrc === true) {
		//recupero le informazioni sul proxy da .npmrc
	    var npmrcPath = getUserHome() + '/.npmrc';
	    fs.readFile(npmrcPath, 'utf8', function readcb(err, data) {
	        if (err) {
	            console.log('There was an error reading "' + npmrcPath + '" file.', '\n', err);
	        } else {
	            var rows = data.split(/[\r\n]/);
	            for (var ii = 0; ii < rows.length; ii++) {
	                var tokens = NPMRC_KEYS.exec(rows[ii]);
	                if (tokens && tokens.length == 3) {
	                    options[tokens[1]] = tokens[2];
	                }
	            }
	            writeOut(options, end);
	        }
	    });		
	} else {
		writeOut(options, end);
	}
}

//elimina i campi vuoti
function cleanObj(obj) {
	delete obj.usenpmrc;
	for (var aa in obj) {
		if (!obj[aa]) { delete obj[aa] };
	}
}

function writeOut(obj, cb) {
	//pulisco l'oggetto prima della scrittura
	cleanObj(obj);
	console.log("write", obj);
    //se gia' presente il file verra' sostituito
    var path = './.bowerrc';
    fs.open(path, 'w', function writeFs(err, fd) {
        if (err) {
            cb(err);
        } else {
            fs.write(fd, JSON.stringify(obj), 0, 'utf8', function writecb(err, written, string) {
                if (err) {
                    cb(err);
                } else {
                    cb(null);
                }
            });
        }
    });
}

// function printHelp() {
//     console.log(
//         "Ver. " + VER + "\n" +
//         "Usage:\n" +
//         "    createbowerrc <options>\n\n" +
//         "Options:\n" +
//         "    -h, --help                This help.\n" +
//         "    -d, --directory <path>    The path in which installed components should be\n" +
//         "                              saved. If not specified this defaults to\n" +
//         "                              bower_components.\n" +
//         "    -p, --proxy <url>         The proxy to use for http requests.\n" +
//         "    -s, --ssl <true|false>    Whether or not to do SSL key validation when\n" +
//         "                              making requests via https.\n" +
//         "    -n, --npmrc               Load config from .npmrc file.\n"
//     );
// }

function end(err) {
    if (err) {
        throw err;
    } else {
        console.log('.bowerrc created in current folder');
    }
}

exports.exec = exec;
exports.create = create;