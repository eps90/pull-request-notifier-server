///<reference path="../typings/tsd.d.ts"/>

import configModule = require('./../lib/config');
import mockFs = require('mock-fs');
import chai = require('chai');
var expect = chai.expect;
import jsYaml = require('js-yaml');

describe('Config', () => {
    beforeEach(() => {
        configModule.Config.reset();
    });

    afterEach(() => {
        mockFs.restore();
    });

    it('should load config from file', () => {
        var configObj = {
            baseUrl: 'http://example.com',
            teamName: 'aaaa',
            user: 'my.user',
            password: 'topsecret',
            webhook_port: 1234,
            socket_port: 4321
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
        expect(config).to.have.property('webhook_port', 1234);
        expect(config).to.have.property('socket_port', 4321);
    });

    it('should throw when config file does not exist', () => {
        mockFs({
            'config': {}
        });

        /* tslint:disable */
        expect(() => {configModule.Config.getConfig()}).to.throw(Error);
        /* tslint:enable */
    });

    it('should allow to set config to not to load it from file', () => {
        var cachedConfig = {
            baseUrl: 'http://example.com',
            teamName: 'aaaa',
            user: 'my.user',
            password: 'topsecret',
            webhook_port: 1234,
            socket_port: 4321
        };

        var fileConfig = {
            baseUrl: 'http://example.fr',
            teamName: 'bbbb',
            user: 'dummy.user',
            password: 'weak.password',
            webhook_port: 1234,
            socket_port: 4321
        };

        var configContent = jsYaml.dump(fileConfig);

        mockFs({
            'config': {
                'config.yml': mockFs.file({
                    content: configContent
                })
            }
        });

        configModule.Config.setUp({config: cachedConfig});
        var config = configModule.Config.getConfig();

        expect(config).to.have.property('baseUrl', 'http://example.com');
        expect(config).to.have.property('teamName', 'aaaa');
        expect(config).to.have.property('user', 'my.user');
        expect(config).to.have.property('password', 'topsecret');
    });

    it('should allow to change config path', () => {
        var configOne = {
            baseUrl: 'http://example.com',
            teamName: 'aaaa',
            user: 'my.user',
            password: 'topsecret',
            webhook_port: 1234,
            socket_port: 4321
        };

        var configTwo = {
            baseUrl: 'http://example.fr',
            teamName: 'bbbb',
            user: 'dummy.user',
            password: 'weak.password',
            webhook_port: 1234,
            socket_port: 4321
        };

        var configOneContent = jsYaml.dump(configOne);
        var configTwoContent = jsYaml.dump(configTwo);

        mockFs({
            'config': {
                'config.yml': mockFs.file({
                    content: configOneContent
                }),
                'another_config.yml': mockFs.file({
                    content: configTwoContent
                })
            }
        });

        configModule.Config.setUp({path: 'config/another_config.yml'});
        var config = configModule.Config.getConfig();

        expect(config).to.have.property('baseUrl', 'http://example.fr');
        expect(config).to.have.property('teamName', 'bbbb');
        expect(config).to.have.property('user', 'dummy.user');
        expect(config).to.have.property('password', 'weak.password');
    });

    it('should keep cached config event if the config file contents changes', () => {
        var configOne = {
            baseUrl: 'http://example.com',
            teamName: 'aaaa',
            user: 'my.user',
            password: 'topsecret',
            webhook_port: 1234,
            socket_port: 4321
        };

        var configTwo = {
            baseUrl: 'http://example.fr',
            teamName: 'bbbb',
            user: 'dummy.user',
            password: 'weak.password',
            webhook_port: 1234,
            socket_port: 4321
        };

        var configOneContent = jsYaml.dump(configOne);
        var configTwoContent = jsYaml.dump(configTwo);

        mockFs({
            'config': {
                'config.yml': mockFs.file({
                    content: configOneContent
                })
            }
        });

        configModule.Config.getConfig();

        mockFs({
            'config': {
                'config.yml': mockFs.file({
                    content: configTwoContent
                })
            }
        });

        var config = configModule.Config.getConfig();

        expect(config).to.have.property('baseUrl', 'http://example.com');
        expect(config).to.have.property('teamName', 'aaaa');
        expect(config).to.have.property('user', 'my.user');
        expect(config).to.have.property('password', 'topsecret');
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

        it('should throw when config value is in wrong type', () => {
            var configObj = {
                baseUrl: null,
                teamName: 'aaaa',
                user: 'my.user',
                password: 'topsecret',
                webhook_port: 'abc'
            };

            var configContent = jsYaml.safeDump(configObj);

            mockFs({
                'config': {
                    'config.yml': mockFs.file({
                        content: configContent
                    })
                }
            });

            expect(() => { configModule.Config.getConfig(); }).to.throw(Error);
        });
    });
});
