///<reference path="../typings/tsd.d.ts"/>

import yaml = require('js-yaml');
import fs = require('fs');

export class Config {
    config: any;

    constructor() {
        this.config = yaml.safeLoad(fs.readFileSync('config/config.yml', 'utf-8'));
    }
}
