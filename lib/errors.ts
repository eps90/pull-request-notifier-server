class BaseError {
    constructor() {
        Error.apply(this, arguments);
    }
}

BaseError.prototype = new Error();

export class HttpRequestError extends BaseError {
    name: string = 'HttpRequestError';

    constructor() {
        super();
    }

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

export class ConfigError extends BaseError {
    name: string = 'ConfigError';

    constructor() {
        super();
    }

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

    static throwConfigPropertyHasWrongType(propertyName: string, expectedType: string, actualType: string): Error {
        var message = "Expected property '" + propertyName + "' to be type of '" + expectedType + "'" +
            ". Got '" + actualType + "' instead";
        return new Error(message);
    }
}
