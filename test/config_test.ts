///<reference path="../typings/tsd.d.ts"/>

import configModule = require('./../lib/config');
import mockFs = require('mock-fs');
import chai = require('chai');
var expect = chai.expect;

describe('Config', () => {
    afterEach(() => {
        mockFs.restore();
    });

    it('should load config from file', () => {
        var configContent = 'a: b\nc: d\n';
        mockFs({
            'config': {
                'config.yml': mockFs.file({
                    content: configContent
                })
            }
        });

        var configInstance = new configModule.Config();
        var expectedConfig = {
            a: 'b',
            c: 'd'
        };

        expect(configInstance.config).to.have.property('a', 'b');
        expect(configInstance.config).to.have.property('c', 'd');
    });
});
