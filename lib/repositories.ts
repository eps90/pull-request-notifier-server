///<reference path="../typings/tsd.d.ts"/>

import models = require('./models');
import request = require('request');
import url = require('url');
import q = require('q');

function getPagesList(response:any):Array<string> {
    if (!response.hasOwnProperty('next')) {
        return [];
    }

    var urlList:Array<string> = [];

    var nextPageUrlParams:url.Url = url.parse(response.next, true);
    delete nextPageUrlParams.search;

    var pageNum:number = Math.ceil(response.size / response.pagelen);

    var nextPageNum:number = nextPageUrlParams.query.page;
    for (var pageIndex = nextPageNum; pageIndex <= pageNum; pageIndex++) {
        nextPageUrlParams.query.page = pageIndex;
        var newUrl = url.format(nextPageUrlParams);
        urlList.push(newUrl);
    }

    return urlList;
}

function getRequestPromises(urls:Array<string>) {
    var promises = [];

    for (var urlIndex = 0; urlIndex < urls.length; urlIndex++) {
        var promise = function () {
            var resourceUrl:string = urls[urlIndex];
            var deferred = q.defer();
            request(resourceUrl, (error, res, body) => {
                var response:any = JSON.parse(body);
                deferred.resolve(response.values);
            });

            return deferred.promise;
        };

        promises.push(promise());
    }

    return promises;
}

export class ProjectRepository {
    private baseUrl;
    private path = '/repositories/bitbucket';

    constructor(baseUrl: string) {
        this.baseUrl = baseUrl;
    }

    findAll(callback:(repositories: Array<models.Repository>) => any) {
        var resourceUrl:string = this.baseUrl + this.path;

        request(resourceUrl, (error, res, body) => {
            var response:any = JSON.parse(body);
            var repos:any = response.values;
            var result:Array<models.Repository> = [];

            for (var repoIndex:number = 0; repoIndex < repos.length; repoIndex++) {
                var repo = new models.Repository(repos[repoIndex]);
                result.push(repo);
            }

            var rest = getRequestPromises(getPagesList(response));
            q.all(rest).done((results:Array<any>) => {
                for (var resultIndex = 0; resultIndex < results.length; resultIndex++) {
                    var resultRepos:any = results[resultIndex];

                    for (var repoIndex:number = 0; repoIndex < resultRepos.length; repoIndex++) {
                        var repo = new models.Repository(resultRepos[repoIndex]);
                        result.push(repo);
                    }
                }

                callback(result);
            });
        });
    }
}
