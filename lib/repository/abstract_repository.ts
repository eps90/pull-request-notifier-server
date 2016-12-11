import * as q from 'q';
import * as http from 'http';
import * as request from 'request';
import logger from './../logger';
import {Config} from '../config';
import {HttpRequestError} from "../errors";

interface CollectionResponse {
    next?: string;
    values: any[];
}

export abstract class AbstractRepository {
    protected static requestForAll(requestUri: string, data: any[] = []) {
        const requestUrl = this.buildFullUrl(requestUri);

        return q.Promise((resolve, reject) => {
            this.makeRequest(requestUrl)
                .then((responseDecoded: CollectionResponse) => {
                    data = data.concat(responseDecoded.values);
                    const nextValue = responseDecoded.hasOwnProperty('next') ? responseDecoded.next : null;
                    resolve(nextValue);
                })
                .catch((reason) => {
                    reject(reason);
                })
        }).then((responseUrl: string) => {
            return responseUrl === null ? data : this.requestForAll(responseUrl, data);
        });
    }

    protected static requestForOne(requestUrl: string) {
        return this.makeRequest(requestUrl);
    }

    private static makeRequest(requestUrl) {
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
