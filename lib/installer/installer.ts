///<reference path="../../typings/tsd.d.ts"/>

import fs = require('fs');
import jsYaml = require('js-yaml');
import _ = require('lodash');
var colors = require('colors');

class Logger {
    static logsEnabled = false;

    private static writeConsole(message:string, level: string = 'log') {
        if (this.logsEnabled) {
            console[level](message);
        }
    }

    static log(msg: string) {
        this.writeConsole(msg, 'log');
    }

    static info(msg: string) {
        this.writeConsole(msg, 'info')
    }
}



export class Paramfile {
    templatePath: string = '';
    destinationPath: string = '';
    envMap: {[configKey: string]: string} = {};

    constructor(paramFilePath: string) {
        Logger.info('Reading file '.green + paramFilePath.green.bold);
        if (!fs.existsSync(paramFilePath)) {
            throw new Error('File '.red + paramFilePath.red.bold + ' not found'.red);
        }

        var config = JSON.parse(fs.readFileSync(paramFilePath, {encoding: 'utf8'}));
        if (config.hasOwnProperty('template')) {
            this.templatePath = process.cwd() + '/' + config.template;
        }

        if (config.hasOwnProperty('destination')) {
            this.destinationPath = process.cwd() + '/' + config.destination;
        }

        if (config.hasOwnProperty('env_map')) {
            this.envMap = config.env_map;
        }
    }
}

export class Installer {
    private paramFilePath: string = process.cwd() + '/paramfile.json';

    constructor(logsEnabled: boolean = false) {
        Logger.logsEnabled = logsEnabled;
    }

    install(): void {
        var paramfile: Paramfile = new Paramfile(this.paramFilePath);
        var toProcess = this.getParamsToProcess(paramfile);
        var destinationConfig = {};
        if (fs.existsSync(paramfile.destinationPath)) {
            destinationConfig = jsYaml.safeLoad(fs.readFileSync(paramfile.destinationPath, {encoding: 'utf8'}));
        }

        Logger.info('Processing config'.green);
        for (var configIdx = 0, configLen = toProcess.length; configIdx < configLen; configIdx++) {
            var configKey = toProcess[configIdx];

            Logger.info('Processing '.gray + configKey.gray.bold + ' ...'.gray);
            Logger.info('Property '.yellow + configKey.yellow.bold + ' is not set, resolving...'.yellow);

            if (paramfile.envMap.hasOwnProperty(configKey)) {
                Logger.info('Searching for '.gray + paramfile.envMap[configKey].gray.bold + ' in environment variables'.gray);
                if (process.env.hasOwnProperty(paramfile.envMap[configKey])) {
                    if (process.env[paramfile.envMap[configKey]] == Number(process.env[paramfile.envMap[configKey]])) {
                        destinationConfig[configKey] = Number(process.env[paramfile.envMap[configKey]]);
                    } else {
                        destinationConfig[configKey] = process.env[paramfile.envMap[configKey]];
                    }
                } else {
                    throw new Error('Environment variable '.red + paramfile.envMap[configKey].red.bold + ' not found!'.red);
                }
            } else {
                throw new Error('Cannot set '.red + configKey.red.bold);
            }
        }

        var destConfig = jsYaml.safeDump(destinationConfig);
        fs.writeFileSync(paramfile.destinationPath, destConfig);
    }

    private getParamsToProcess(paramfile: Paramfile): Array<string> {
        Logger.info('Parsing template file:'.green + paramfile.templatePath.green.bold);
        var template = jsYaml.safeLoad(fs.readFileSync(paramfile.templatePath, {encoding: 'utf8'}));
        var destination = {};

        if (fs.existsSync(paramfile.destinationPath)) {
            destination = jsYaml.safeLoad(fs.readFileSync(paramfile.destinationPath, {encoding: 'utf8'}));
        } else {
            Logger.log('Destination config at '.gray + paramfile.destinationPath.gray.bold + ' does not exists'.gray);
        }

        var toProcess: Array<string> = [];

        for (var tempConfig in template) {
            if (!template.hasOwnProperty(tempConfig)) {
                continue;
            }

            if (!destination.hasOwnProperty(tempConfig)) {
                toProcess.push(tempConfig);
            }
        }

        return toProcess;
    }
}
