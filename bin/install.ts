///<reference path="../typings/tsd.d.ts"/>

import installer = require('./../lib/installer/installer');
var colors = require('colors');

var installScript = new installer.Installer(true);
try {
    installScript.install();
} catch (e) {
    console.error(e.message);
    console.error('Aborting'.red.bold);
    process.exit(1);
}

console.log('Installation completed'.green.bold);

