import * as chai from 'chai';
import * as mockFs from 'mock-fs';
import * as jsYaml from 'js-yaml';
import * as fs from 'fs';
import {Installer} from './../../lib/installer/installer';

var expect = chai.expect;

/* tslint:disable:no-string-literal */
describe('Installer', () => {
    afterEach(() => {
        mockFs.restore();
        delete process.env['PARAM_AAA'];
        delete process.env['PARAM_BBB'];
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

        var installer = new Installer();
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

        var installer = new Installer();
        installer.install();

        var actualConfig = jsYaml.safeLoad(fs.readFileSync(configPath, {encoding: 'utf8'}));
        expect(actualConfig['aaaa']).to.eq('predefined value');
        expect(actualConfig['bbbb']).to.eq(bParamValue);
    });

    it('should throw when mapped env var is does not exist', () => {
        var templatePath = 'config/config.yml.dist';
        var configPath = 'config/config.yml';
        var aParam = 'PARAM_AAA';
        var aParamValue = 'SET PARAM_AAA';
        var bParam = 'PARAM_BBB';

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

        var installer = new Installer();
        expect(() => { installer.install(); }).to.throw();
    });

    it('should throw when paramfile.json does not exist', () => {
        mockFs({});

        var installer = new Installer();
        expect(() => { installer.install(); }).to.throw();
    });
});
/* tslint:enable:no-string-literal */
