///<reference path="../../typings/tsd.d.ts"/>

import chai = require('chai');
var expect = chai.expect;
import mockFs = require('mock-fs');
import jsYaml = require('js-yaml');
import fs = require('fs');
import installerModule = require('./../../lib/installer/installer');

describe.only('Installer', () => {
    afterEach(() => {
        mockFs.restore();
    });

    it('should process a config file when it doesn\'t exist', () => {
        var templatePath = 'config/config.yml.dist';
        var configPath = 'config/config.yml';
        var aParam = 'PARAM_AAA';
        var aParamValue = 'SET PARAM_AAA';
        var bParam = 'PARAM_BBB';
        var bParamValue = 'SET PARAM_BBB';

        var paramFile = {
            template: templatePath,
            destination: configPath,
            env_map: {
                'aaaa': aParam,
                'bbbb': bParam
            }
        };

        var template = {
            'aaaa': null,
            'bbbb': null
        };

        process.env[aParam] = aParamValue;
        process.env[bParam] = bParamValue;

        var templateContent = jsYaml.dump(template);

        mockFs({
            "paramfile.json": mockFs.file({
                content: JSON.stringify(paramFile)
            }),
            config: {
                "config.yml.dist": mockFs.file({
                    content: templateContent
                })
            }
        });

        var installer = new installerModule.Installer();
        installer.install();

        var actualConfig = jsYaml.safeLoad(fs.readFileSync(configPath, {encoding: 'utf8'}));
        expect(actualConfig['aaaa']).to.eq(aParamValue);
        expect(actualConfig['bbbb']).to.eq(bParamValue);
    });

    it('should process only values that are not set in destination config', () => {
        var templatePath = 'config/config.yml.dist';
        var configPath = 'config/config.yml';
        var aParam = 'PARAM_AAA';
        var aParamValue = 'SET PARAM_AAA';
        var bParam = 'PARAM_BBB';
        var bParamValue = 'SET PARAM_BBB';

        var paramFile = {
            template: templatePath,
            destination: configPath,
            env_map: {
                'aaaa': aParam,
                'bbbb': bParam
            }
        };

        var template = {
            'aaaa': null,
            'bbbb': null
        };

        process.env[aParam] = aParamValue;
        process.env[bParam] = bParamValue;

        var destination = {
            'aaaa': 'predefined value'
        };

        var templateContent = jsYaml.dump(template);
        var destContent = jsYaml.dump(destination);

        mockFs({
            "paramfile.json": mockFs.file({
                content: JSON.stringify(paramFile)
            }),
            config: {
                "config.yml": mockFs.file({
                    content: destContent
                }),
                "config.yml.dist": mockFs.file({
                    content: templateContent
                })
            }
        });

        var installer = new installerModule.Installer();
        installer.install();

        var actualConfig = jsYaml.safeLoad(fs.readFileSync(configPath, {encoding: 'utf8'}));
        expect(actualConfig['aaaa']).to.eq('predefined value');
        expect(actualConfig['bbbb']).to.eq(bParamValue);
    });
});
