///<reference path="../typings/tsd.d.ts"/>

import http = require('http');

export class HttpRequestError {
    static throwError(url: string, response?: {statusCode?: number}, responseBody?: string) {
        var message = 'Http request to ' + url + ' failed';
        var messageParts = [];
        if (response !== undefined && response.hasOwnProperty('statusCode')) {
            messageParts.push('with response code ' + response.statusCode);
        }

        if (responseBody !== undefined) {
            messageParts.push("with message: '" + responseBody + "'");
        }

        if (messageParts.length) {
            message += ' ' + messageParts.join(' and ');
        }

        return new Error(message);
    }
}
