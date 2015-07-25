///<reference path="../typings/tsd.d.ts"/>

import configModule = require('./../lib/config');
import mockFs = require('mock-fs');
import chai = require('chai');
var expect = chai.expect;
import jsYaml = require('js-yaml');

describe('Config', () => {
    afterEach(() => {
        mockFs.restore();
    });

    it('should load config from file', () => {
        var configObj = {
            baseUrl: 'http://example.com',
            teamName: 'aaaa',
            user: 'my.user',
            password: 'topsecret'
        };

        var configContent = jsYaml.safeDump(configObj);

        mockFs({
            'config': {
                'config.yml': mockFs.file({
                    content: configContent
                })
            }
        });

        var config = configModule.Config.getConfig();

        expect(config).to.have.property('baseUrl', 'http://example.com');
        expect(config).to.have.property('teamName', 'aaaa');
        expect(config).to.have.property('user', 'my.user');
        expect(config).to.have.property('password', 'topsecret');
    });

    it('should throw when config file does not exist', () => {
        mockFs({
            'config': {}
        });

        /* tslint:disable */
        expect(() => {configModule.Config.getConfig()}).to.throw(Error);
        /* tslint:enable */
    });

    describe('Validation errors', () => {
        it('should throw when config has not provided required keys', () => {
            var configObj = {
                baseUrl: 'http://example.com',
                teamName: 'aaaa',
                user: 'my.user'
            };

            var configContent = jsYaml.safeDump(configObj);

            mockFs({
                'config': {
                    'config.yml': mockFs.file({
                        content: configContent
                    })
                }
            });

            /* tslint:disable */
            expect(() => { configModule.Config.getConfig()}).to.throw(Error);
            /* tslint:enable */
        });

        it('should throw when config has empty property', () => {
            var configObj = {
                baseUrl: null,
                teamName: 'aaaa',
                user: 'my.user',
                password: 'topsecret'
            };

            var configContent = jsYaml.safeDump(configObj);

            mockFs({
                'config': {
                    'config.yml': mockFs.file({
                        content: configContent
                    })
                }
            });

            /* tslint:disable */
            expect(() => { configModule.Config.getConfig() }).to.throw(Error);
            /* tslint:enable */
        });
    });
});
