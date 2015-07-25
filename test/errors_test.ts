///<reference path="../typings/tsd.d.ts"/>

import chai = require('chai');
var expect = chai.expect;
import errors = require('./../lib/errors');

describe('Errors', () => {
    describe('Http request error', () => {
        it.only('should throw a customized message', () => {
            var url = 'http://example.com';
            var responseCode = 400;
            var message = 'Something went wrong';

            var expectedErrorString = "Http request to http://example.com failed with response code 400 and with message: " +
                "'Something went wrong'";
            expect(() => {errors.HttpRequestError.throwError(url, responseCode, message)}).to.throw(Error, expectedErrorString);
        });
    });
});
