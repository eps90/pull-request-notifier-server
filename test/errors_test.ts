///<reference path="../typings/tsd.d.ts"/>

import chai = require('chai');
var expect = chai.expect;
import errors = require('./../lib/errors');

describe('Errors', () => {
    describe('Http request error', () => {
        it('should throw a customized message', () => {
            var url = 'http://example.com';
            var response = {statusCode: 400};
            var message = 'Something went wrong';

            var expectedErrorString = "Http request to http://example.com failed with response code 400 and with message: " +
                "'Something went wrong'";
            expect(() => {throw errors.HttpRequestError.throwError(url, response, message)}).to.throw(Error, expectedErrorString);
        });
    });

    describe('ConfigError', () => {
        it('should throw a customized message', () => {
            var configPath = 'config/config.yml';
            var expectedErrorString = "Config file at 'config/config.yml' not found";
            expect(() => {throw errors.ConfigError.throwFileNotFound(configPath)}).to.throw(Error, expectedErrorString);
        });
    });
});
