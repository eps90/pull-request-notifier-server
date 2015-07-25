///<reference path="../typings/tsd.d.ts"/>

import http = require('http');

export class HttpRequestError {
    static throwError(url: string, response?: {statusCode?: number}, responseBody?: string): Error {
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

export class ConfigError {
    static throwFileNotFound(fileName: string): Error {
        var message = "Config file at '" + fileName + "' not found";
        return new Error(message);
    }

    static throwConfigPropertyRequired(propertyName: string): Error {
        var message = "Config property '" + propertyName + "' is required";
        return new Error(message);
    }

    static throwConfigPropertyValueRequired(propertyName: string): Error {
        var message = "Config property '" + propertyName + "' cannot be empty";
        return new Error(message);
    }
}
