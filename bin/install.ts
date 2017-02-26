import {Installer} from '../lib/installer/installer';
import * as colors from 'colors';

var installScript = new Installer(true);
try {
    installScript.install();
} catch (e) {
    console.error(e.message);
    console.error('Aborting'.red.bold);
    process.exit(1);
}

console.log('Installation completed'.green.bold);

