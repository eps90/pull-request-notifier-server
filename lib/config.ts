///<reference path="../typings/tsd.d.ts"/>

import yaml = require('js-yaml');
import fs = require('fs');

export interface ConfigInterface {
    baseUrl: string;
    teamName: string;
    user: string;
    password: string;
}

// @todo Make somehow Config class static
export class Config {
    config: ConfigInterface;
    private configMapping: Array<string> = [
        'baseUrl',
        'teamName',
        'user',
        'password'
    ];
    private configPath: string = 'config/config.yml';

    constructor() {
        if (!fs.existsSync(this.configPath)) {
            throw "'" + this.configPath + "' file not found";
        }

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
