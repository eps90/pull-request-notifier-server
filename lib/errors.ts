///<reference path="../typings/tsd.d.ts"/>

class BaseError {
    constructor() {
        Error.apply(this, arguments);
    }
}

BaseError.prototype = new Error();

export class HttpRequestError extends BaseError {
    name: string = 'HttpRequestError';

    constructor(public message?: string) {
        super();
    }

    static throwError(url: string, response?: {statusCode?: number}, responseBody?: string): HttpRequestError {
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

        return new HttpRequestError(message);
    }
}

export class ConfigError extends BaseError {
    name: string = 'ConfigError';

    constructor(public message?: string) {
        super();
    }

    static throwFileNotFound(fileName: string): ConfigError {
        var message = "Config file at '" + fileName + "' not found";
        return new ConfigError(message);
    }

    static throwConfigPropertyRequired(propertyName: string): ConfigError {
        var message = "Config property '" + propertyName + "' is required";
        return new ConfigError(message);
    }

    static throwConfigPropertyValueRequired(propertyName: string): ConfigError {
        var message = "Config property '" + propertyName + "' cannot be empty";
        return new ConfigError(message);
    }

    static throwConfigPropertyHasWrongType(propertyName: string, expectedType: string, actualType: string): ConfigError {
        var message = "Expected property '" + propertyName + "' to be type of '" + expectedType + "'" +
            ". Got '" + actualType + "' instead";
        return new ConfigError(message);
    }
}
