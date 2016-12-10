import * as url from 'url';
import * as q from 'q';
import * as http from 'http';
import * as request from 'request';
// @todo Change to default export
import logger = require('./../logger');
import {Config} from '../config';
import {HttpRequestError} from "../errors";
import {ModelInterface} from "../model/model";

// @todo Get rid of AbstractRepository and make its methods simple functions
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

    static getPagesList(response: any): string[] {
        if (!response.hasOwnProperty('next')) {
            return [];
        }

        const urlList: string[] = [];

        const nextPageUrlParams: url.Url = url.parse(response.next, true);
        delete nextPageUrlParams.search;

        const pageNum: number = Math.ceil(response.size / response.pagelen);

        const nextPageNum: number = nextPageUrlParams.query.page;
        for (let pageIndex = nextPageNum; pageIndex <= pageNum; pageIndex++) {
            nextPageUrlParams.query.page = pageIndex;
            const newUrl = url.format(nextPageUrlParams);
            urlList.push(newUrl);
        }

        return urlList;
    }

    static getRequestPromises(urls: string[], authConfig: any): q.Promise<any>[] {
        const promises: q.Promise<any>[] = [];

        for (var urlIndex = 0; urlIndex < urls.length; urlIndex++) {
            const promise: () => q.Promise<any> = () => {
                const resourceUrl: string = urls[urlIndex];
                const deferred = q.defer();

                logger.logHttpRequestAttempt(resourceUrl);
                request(resourceUrl, authConfig, (error, res: http.IncomingMessage, body) => {
                    if (error || res.statusCode !== 200) {
                        logger.logHttpRequestFailed(resourceUrl);
                        return deferred.reject(HttpRequestError.throwError(resourceUrl, res, body));
                    }
                    logger.logHttpRequestSucceed(resourceUrl);
                    const response: any = JSON.parse(body);
                    deferred.resolve(response.values);
                });

                return deferred.promise;
            };

            promises.push(promise());
        }

        return promises;
    }

    static getCollection<T extends ModelInterface>(type: {create: (rawObject: any) => T}, repoObjects: any[]): T[] {
        const result: T[] = [];

        for (let repoIndex: number = 0; repoIndex < repoObjects.length; repoIndex++) {
            const repo = type.create(repoObjects[repoIndex]);
            result.push(repo);
        }

        return result;
    }
}
