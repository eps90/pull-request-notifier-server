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
    webhook_port: number;
    socket_port: number;
}

export interface ConfigParams {
    config?: ConfigInterface;
    path?: string;
}

export class Config {
    private static configMapping: any = {
        'baseUrl': {
            required: true,
            notEmpty: true
        },
        'teamName': {
            required: true,
            notEmpty: true
        },
        'user': {
            required: true,
            notEmpty: true
        },
        'password': {
            required: true,
            notEmpty: true
        },
        webhook_port: {
            required: true,
            notEmpty: true,
            type: 'number'
        },
        socket_port: {
            required: true,
            notEmpty: true,
            type: 'number'
        }
    };

    private static configPath: string = 'config/config.yml';
    private static cachedConfig: ConfigInterface;

    static getConfig(): ConfigInterface {
        if (this.cachedConfig !== undefined) {
            return this.cachedConfig;
        }

        if (!fs.existsSync(this.configPath)) {
            throw errors.ConfigError.throwFileNotFound(this.configPath);
        }

        logger.logLoadingConfigFile(this.configPath);

        var config: any = yaml.safeLoad(fs.readFileSync(this.configPath, 'utf-8'));
        this.validateConfig(config, this.configMapping);

        this.cachedConfig = config;

        return config;
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

    private static validateConfig(config: any, configMapping: any): void {
        for (var keyName in configMapping) {
            if (!configMapping.hasOwnProperty(keyName)) {
                continue;
            }

            var keyValue = configMapping[keyName];
            if (keyValue.required && !config.hasOwnProperty(keyName)) {
                throw errors.ConfigError.throwConfigPropertyRequired(keyValue);
            }

            if (keyValue.notEmpty && config.hasOwnProperty(keyName) && config[keyName] === null) {
                throw errors.ConfigError.throwConfigPropertyValueRequired(keyValue);
            }

            if (keyValue.hasOwnProperty('type') && config.hasOwnProperty(keyName) && typeof config[keyName] !== keyValue.type) {
                throw errors.ConfigError.throwConfigPropertyHasWrongType(keyValue, keyValue.type, typeof config[keyName]);
            }
        }
    }
}
