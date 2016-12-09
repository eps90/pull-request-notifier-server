import * as url from 'url';
import * as q from 'q';
import * as http from 'http';
import * as request from 'request';
// @todo Change to default export
import logger = require('./../logger');
import {HttpRequestError} from "../errors";
import {ModelInterface} from "../model/model";

// @todo Get rid of AbstractRepository and make its methods simple functions
export class AbstractRepository {
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
