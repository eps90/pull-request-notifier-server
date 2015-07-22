///<reference path="../typings/tsd.d.ts"/>

import yaml = require('js-yaml');
import fs = require('fs');

// @todo Validate config contents
// @todo Check whether config file exists
export class Config {
    config: any;

    constructor() {
        this.config = yaml.safeLoad(fs.readFileSync('config/config.yml', 'utf-8'));
    }
}
