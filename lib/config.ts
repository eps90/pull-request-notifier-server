///<reference path="../typings/tsd.d.ts"/>

import yaml = require('js-yaml');
import fs = require('fs');
import errors = require('./errors');

export interface ConfigInterface {
    baseUrl: string;
    teamName: string;
    user: string;
    password: string;
}

export class Config {
    private static configMapping: Array<string> = [
        'baseUrl',
        'teamName',
        'user',
        'password'
    ];

    private static configPath: string = 'config/config.yml';

    static getConfig(): ConfigInterface {
        if (!fs.existsSync(this.configPath)) {
            throw errors.ConfigError.throwFileNotFound(this.configPath);
        }

        var config: any = yaml.safeLoad(fs.readFileSync('config/config.yml', 'utf-8'));
        for (var propertyIndex = 0; propertyIndex < this.configMapping.length; propertyIndex++) {
            var property = this.configMapping[propertyIndex];
            if (!config.hasOwnProperty(property)) {
                throw errors.ConfigError.throwConfigPropertyRequired(property);
            } else if (config[property] === null) {
                throw errors.ConfigError.throwConfigPropertyValueRequired(property);
            }
        }

        return config;
    }
}
