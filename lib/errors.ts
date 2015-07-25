///<reference path="../typings/tsd.d.ts"/>

import http = require('http');

export class HttpRequestError {
    static throwError(url: string, responseCode?: number, responseBody?: string) {
        var message = 'Http request to ' + url + ' failed';
        var messageParts = [];
        if (responseCode !== undefined) {
            messageParts.push('with response code ' + responseCode);
        }

        if (responseBody !== undefined) {
            messageParts.push("with message: '" + responseBody + "'");
        }

        if (messageParts.length) {
            message += ' ' + messageParts.join(' and ');
        }

        throw new Error(message);
    }
}
