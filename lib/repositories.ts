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

export class ProjectRepository extends AbstractRepository {
    private baseUrl;
    private teamName;

    static repositories:Array<models.Repository> = [];

    constructor(baseUrl: string, teamName: string) {
        super();
        this.baseUrl = baseUrl;
        this.teamName = teamName;
    }

    fetchAll(callback:(repositories: Array<models.Repository>) => void) {
        var resourceUrl:string = this.baseUrl + '/repositories/' + this.teamName;

        request(resourceUrl, (error, res, body) => {
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
                callback(result);
            });
        });
    }

    findAll(callback:(repositories: Array<models.Repository>) => void):void {
        if (!ProjectRepository.repositories.length) {
            this.fetchAll((repos:Array<models.Repository>) => {
                callback(repos);
            });
        } else {
            callback(ProjectRepository.repositories);
        }
    }
}

export class PullRequestRepository extends AbstractRepository {
    static pullRequests:Array<models.PullRequest> = [];

    fetchByRepository(repository:models.Repository, callback:(pullRequests:Array<models.PullRequest>) => void) {
        var pullRequestsUrl = repository.pullRequestsUrl;
        request(pullRequestsUrl, (error, res, body) => {
            var response:any = JSON.parse(body);
            var pullRequests:any = response.values;
            var result:Array<models.PullRequest> = this.getCollection(models.PullRequest, pullRequests);

            var rest = this.getRequestPromises(this.getPagesList(response));
            q.all(rest).done((results:Array<any>) => {
                for (var resultIndex = 0; resultIndex < results.length; resultIndex++) {
                    var resultPrs:any = results[resultIndex];
                    result = result.concat(this.getCollection(models.PullRequest, resultPrs));
                }

                PullRequestRepository.pullRequests = result;
                callback(result);
            });
        });
    }

    findAll(repository:models.Repository, callback:(foundPullRequests:Array<models.PullRequest>) => void) {
        if (!PullRequestRepository.pullRequests.length) {
            this.fetchByRepository(repository, (foundPullRequests:Array<models.PullRequest>) => {
                callback(foundPullRequests);
            });
        } else {
            callback(PullRequestRepository.pullRequests);
        }
    }

    findByReviewer(username:string, callback:(pullRequests:Array<models.PullRequest>) => void):void {
        var pullRequests = PullRequestRepository.pullRequests.filter((pr: models.PullRequest) => {
            var reviewers = pr.reviewers;
            for (var reviewerIndex = 0; reviewerIndex < reviewers.length; reviewerIndex++) {
                var reviewer = reviewers[reviewerIndex];
                if (reviewer.user.username == username) {
                    return true;
                }
            }

            return false;
        });

        callback(pullRequests);
    }

    findByAuthor(username:string, callback:(pullRequests:Array<models.PullRequest>) => any):void {
        var pullRequests = PullRequestRepository.pullRequests.filter((pr: models.PullRequest) => {
            return pr.author.username === username;
        });

        callback(pullRequests);
    }
}
