///<reference path="../typings/tsd.d.ts"/>

import models = require('./models');
import request = require('request');
import url = require('url');
import q = require('q');

class AbstractRepository {
    getPagesList(response:any):Array<string> {
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

    getRequestPromises(urls:Array<string>) {
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

    getCollection<T extends models.ModelInterface>(type: {new(...args):T}, repoObjects:Array<any>):Array<T> {
        var result:Array<T> = [];

        for (var repoIndex:number = 0; repoIndex < repoObjects.length; repoIndex++) {
            var repo = new type(repoObjects[repoIndex]);
            result.push(repo);
        }

        return result;
    }
}

interface ConfigInterface {
    baseUrl:string;
    teamName:string;
    user:string;
    password:string;
}

export class ProjectRepository extends AbstractRepository {
    private baseUrl;
    private teamName;
    private user;
    private password;

    static repositories:Array<models.Repository> = [];

    constructor(config:ConfigInterface) {
        super();
        this.baseUrl = config.baseUrl;
        this.teamName = config.teamName;
        this.user = config.user;
        this.password = config.password;
    }

    fetchAll():q.Promise<Array<models.Repository>> {
        var resourceUrl:string = this.baseUrl + '/repositories/' + this.teamName;
        var requestConfig = {
            auth: {
                username: this.user,
                password: this.password
            }
        };

        var defer = q.defer<Array<models.Repository>>();

        request(resourceUrl, requestConfig, (error, res, body) => {
            var response:any = JSON.parse(body);
            var repos:any = response.values;
            var result:Array<models.Repository> = this.getCollection(models.Repository, repos);

            var rest = this.getRequestPromises(this.getPagesList(response));
            q.all(rest).done((results:Array<any>) => {
                for (var resultIndex = 0; resultIndex < results.length; resultIndex++) {
                    var resultRepos:any = results[resultIndex];
                    result = result.concat(this.getCollection(models.Repository, resultRepos));
                }

                ProjectRepository.repositories = result;

                defer.resolve(result);
            });
        });

        return defer.promise;
    }

    findAll(callback:(repositories: Array<models.Repository>) => void):void {
        callback(ProjectRepository.repositories);
    }
}

interface PullRequestSet {
    [repositoryName:string]: Array<models.PullRequest>;
}

export class PullRequestRepository extends AbstractRepository {
    private user;
    private password;

    static pullRequests:PullRequestSet = {};

    constructor(config:ConfigInterface) {
        super();
        this.user = config.user;
        this.password = config.password;
    }

    fetchByRepository(repository:models.Repository):q.Promise<Array<models.PullRequest>> {
        var parsedUrl = url.parse(repository.pullRequestsUrl);
        var requestConfig = {
            auth: {
                username: this.user,
                password: this.password
            }
        };

        delete parsedUrl.search;
        parsedUrl.query = {
            state: 'OPEN'
        };
        var pullRequestsUrl = url.format(parsedUrl);

        var defer = q.defer<Array<models.PullRequest>>();

        request(pullRequestsUrl, requestConfig, (error, res, body) => {
            var response:any = JSON.parse(body);
            var pullRequests:any = response.values;
            var result:Array<models.PullRequest> = this.getCollection(models.PullRequest, pullRequests);

            var rest = this.getRequestPromises(this.getPagesList(response));
            q.all(rest).done((results:Array<any>) => {
                for (var resultIndex = 0; resultIndex < results.length; resultIndex++) {
                    var resultPrs:any = results[resultIndex];
                    result = result.concat(this.getCollection(models.PullRequest, resultPrs));
                }

                PullRequestRepository.pullRequests[repository.fullName] = result;
                defer.resolve(result);
            });
        });

        return defer.promise;
    }

    findAll(callback:(foundPullRequests:Array<models.PullRequest>) => void) {
        var pullRequests:Array<models.PullRequest> = [];
        for (var repositoryName in PullRequestRepository.pullRequests) {
            if (PullRequestRepository.pullRequests.hasOwnProperty(repositoryName)) {
                pullRequests = pullRequests.concat(PullRequestRepository.pullRequests[repositoryName]);
            }
        }

        callback(pullRequests);
    }

    findByReviewer(username:string, callback:(pullRequests:Array<models.PullRequest>) => void):void {
        var pullRequests:Array<models.PullRequest> = [];
        for (var repositoryName in PullRequestRepository.pullRequests) {
            if (PullRequestRepository.pullRequests.hasOwnProperty(repositoryName)) {
                var prs = PullRequestRepository.pullRequests[repositoryName].filter((pr:models.PullRequest) => {
                    var reviewers = pr.reviewers;
                    for (var reviewerIndex = 0; reviewerIndex < reviewers.length; reviewerIndex++) {
                        var reviewer = reviewers[reviewerIndex];
                        if (reviewer.user.username == username) {
                            return true;
                        }
                    }

                    return false;
                });

                pullRequests = pullRequests.concat(prs);
            }
        }

        callback(pullRequests);
    }

    findByAuthor(username:string, callback:(pullRequests:Array<models.PullRequest>) => any):void {
        var pullRequests:Array<models.PullRequest> = [];
        for (var repositoryName in PullRequestRepository.pullRequests) {
            if (PullRequestRepository.pullRequests.hasOwnProperty(repositoryName)) {
                var prs = PullRequestRepository.pullRequests[repositoryName].filter((pr:models.PullRequest) => {
                    return pr.author.username === username;
                });
                pullRequests = pullRequests.concat(prs);
            }
        }

        callback(pullRequests);
    }
}
