///<reference path="../typings/tsd.d.ts"/>

import yaml = require('js-yaml');
import fs = require('fs');
import errors = require('./errors');
import logger = require('./logger');

export interface ConfigInterface {
    baseUrl: string;
    teamName: string;
    user: string;
    password: string;
}

export interface ConfigParams {
    config?: ConfigInterface;
    path?: string;
}

export class Config {
    private static configMapping: Array<string> = [
        'baseUrl',
        'teamName',
        'user',
        'password'
    ];

    private static configPath: string = 'config/config.yml';
    private static cachedConfig: ConfigInterface;

    static getConfig(): ConfigInterface {
        if (this.cachedConfig !== undefined) {
            return this.cachedConfig;
        }

        if (!fs.existsSync(this.configPath)) {
            throw errors.ConfigError.throwFileNotFound(this.configPath);
        }

        logger.info('Loading config file: %s', this.configPath);

        var config: any = yaml.safeLoad(fs.readFileSync(this.configPath, 'utf-8'));
        this.validateConfig(config, this.configMapping);

        this.cachedConfig = config;

        return config;
    }

    private static validateConfig(config: any, configMapping: any) {
        for (var propertyIndex = 0; propertyIndex < configMapping.length; propertyIndex++) {
            var property = configMapping[propertyIndex];
            if (!config.hasOwnProperty(property)) {
                throw errors.ConfigError.throwConfigPropertyRequired(property);
            } else if (config[property] === null) {
                throw errors.ConfigError.throwConfigPropertyValueRequired(property);
            }
        }
    }

    static setUp(params: ConfigParams): void {
        if (params.hasOwnProperty('config')) {
            this.cachedConfig = params.config;
        }

        if (params.hasOwnProperty('path')) {
            this.configPath = params.path;
        }
    }

    static reset(): void {
        this.cachedConfig = undefined;
        this.configPath = 'config/config.yml';
    }
}
