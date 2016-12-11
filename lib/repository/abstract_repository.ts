import * as q from 'q';
import * as http from 'http';
import * as request from 'request';
import logger from './../logger';
import {Config} from '../config';
import {HttpRequestError} from "../errors";

export abstract class AbstractRepository {
    protected static requestForAll(requestUri: string, data: any[] = []) {
        const requestUrl = this.buildFullUrl(requestUri);
        const requestConfig = this.buildRequestOptions();

        return q.Promise((resolve, reject) => {
            logger.logHttpRequestAttempt(requestUrl);
            request(requestUrl, requestConfig, (error, response, body)  => {
                if (error || response.statusCode !== 200) {
                    logger.logHttpRequestFailed(requestUrl);
                    return reject(HttpRequestError.throwError(requestUrl, response, body));
                }

                logger.logHttpRequestSucceed(requestUrl);
                const responseDecoded = JSON.parse(body);
                data = data.concat(responseDecoded.values);

                if (responseDecoded.hasOwnProperty('next')) {
                    resolve(responseDecoded.next);
                } else {
                    resolve(null);
                }
            });
        }).then((responseUrl: string) => {
            return responseUrl === null
                ? data
                : this.requestForAll(responseUrl, data);
        });
    }

    protected static requestForOne(requestUrl: string) {
        const requestConfig = this.buildRequestOptions();
        return q.Promise((resolve, reject) => {
            logger.logHttpRequestAttempt(requestUrl);
            request(requestUrl, requestConfig, (error, response, body) => {
                if (error || response.statusCode !== 200) {
                    logger.logHttpRequestFailed(requestUrl);
                    return reject(HttpRequestError.throwError(requestUrl, response, body));
                }

                logger.logHttpRequestSucceed(requestUrl);
                const responseDecoded = JSON.parse(body);
                resolve(responseDecoded);
            });
        });
    }

    private static buildFullUrl(path: string) {
        if (path.substr(0, 4) === 'http') {
            return path;
        }

        const config = Config.getConfig();
        return `${config.baseUrl}/${path}`;
    }

    private static buildRequestOptions() {
        const config = Config.getConfig();
        return {
            auth: {
                username: config.user,
                password: config.password
            }
        };
    }
}
