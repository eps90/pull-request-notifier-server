///<reference path="../typings/tsd.d.ts"/>

import yaml = require('js-yaml');
import fs = require('fs');

// @todo Validate config contents
// @todo Check whether config file exists
export class Config {
    config: any;
    private configMapping = [
        'baseUrl',
        'teamName',
        'user',
        'password'
    ];

    constructor() {
        var config: any = yaml.safeLoad(fs.readFileSync('config/config.yml', 'utf-8'));
        for (var propertyIndex = 0; propertyIndex < this.configMapping.length; propertyIndex++) {
            var property = this.configMapping[propertyIndex];
            if (!config.hasOwnProperty(property)) {
                throw "'" + property + "' config property is required";
            } else if (config[property] === null) {
                throw "'" + property + "' config property cannot be null";
            }
        }

        this.config = config;
    }
}
