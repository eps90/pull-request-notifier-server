///<reference path="../typings/tsd.d.ts"/>

import models = require('./models');
import factories = require('./factories');

import request = require('request');
import q = require('q');

import url = require('url');
import http = require('http');

// @todo Get rid of AbstractRepository and make its methods simple functions
class AbstractRepository {
    getPagesList(response: any): Array<string> {
        if (!response.hasOwnProperty('next')) {
            return [];
        }

        var urlList: Array<string> = [];

        var nextPageUrlParams: url.Url = url.parse(response.next, true);
        delete nextPageUrlParams.search;

        var pageNum: number = Math.ceil(response.size / response.pagelen);

        var nextPageNum: number = nextPageUrlParams.query.page;
        for (var pageIndex = nextPageNum; pageIndex <= pageNum; pageIndex++) {
            nextPageUrlParams.query.page = pageIndex;
            var newUrl = url.format(nextPageUrlParams);
            urlList.push(newUrl);
        }

        return urlList;
    }

    // @todo Check for errors
    getRequestPromises(urls: Array<string>): Array<q.Promise<any>> {
        var promises: Array<q.Promise<any>> = [];

        for (var urlIndex = 0; urlIndex < urls.length; urlIndex++) {
            var promise: () => q.Promise<any> = () => {
                var resourceUrl: string = urls[urlIndex];
                var deferred = q.defer();
                request(resourceUrl, (error, res: http.IncomingMessage, body) => {
                    if (error || res.statusCode !== 200) {
                        return deferred.reject('Http request failed');
                    }
                    var response: any = JSON.parse(body);
                    deferred.resolve(response.values);
                });

                return deferred.promise;
            };

            promises.push(promise());
        }

        return promises;
    }

    getCollection<T extends models.ModelInterface>(type: {create: (rawObject: any) => T}, repoObjects: Array<any>): Array<T> {
        var result: Array<T> = [];

        for (var repoIndex: number = 0; repoIndex < repoObjects.length; repoIndex++) {
            var repo = type.create(repoObjects[repoIndex]);
            result.push(repo);
        }

        return result;
    }
}

interface ConfigInterface {
    baseUrl: string;
    teamName: string;
    user: string;
    password: string;
}

export class ProjectRepository extends AbstractRepository {
    static repositories: Array<models.Project> = [];

    private baseUrl: string;
    private teamName: string;
    private user: string;
    private password: string;

    constructor(config: ConfigInterface) {
        super();
        this.baseUrl = config.baseUrl;
        this.teamName = config.teamName;
        this.user = config.user;
        this.password = config.password;
    }

    fetchAll(): q.Promise<Array<models.Project>> {
        var resourceUrl: string = this.baseUrl + '/repositories/' + this.teamName;
        var requestConfig = {
            auth: {
                username: this.user,
                password: this.password
            }
        };

        var defer = q.defer<Array<models.Project>>();

        request(resourceUrl, requestConfig, (error, res: http.IncomingMessage, body) => {
            if (error || res.statusCode !== 200) {
                return defer.reject('Http request failed');
            }
            var response: any = JSON.parse(body);
            var repos: any = response.values;
            var result: Array<models.Project> = this.getCollection<models.Project>(factories.ProjectFactory, repos);

            var rest = this.getRequestPromises(this.getPagesList(response));
            q.all(rest).done(
                (results: Array<any>) => {
                    for (var resultIndex = 0; resultIndex < results.length; resultIndex++) {
                        var resultRepos: any = results[resultIndex];
                        result = result.concat(this.getCollection<models.Project>(factories.ProjectFactory, resultRepos));
                    }

                    ProjectRepository.repositories = result;

                    defer.resolve(result);
                },
                (error) => {
                    return defer.reject(error);
                }
            );
        });

        return defer.promise;
    }

    findAll(): Array<models.Project> {
        return ProjectRepository.repositories;
    }
}

interface PullRequestSet {
    [repositoryName: string]: Array<models.PullRequest>;
}

export class PullRequestRepository extends AbstractRepository {
    static pullRequests: PullRequestSet = {};

    private user: string;
    private password: string;

    constructor(config: ConfigInterface) {
        super();
        this.user = config.user;
        this.password = config.password;
    }

    // @todo Rename to ::fetchByProject
    fetchByRepository(repository: models.Project): q.Promise<Array<models.PullRequest>> {
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

        request(pullRequestsUrl, requestConfig, (error, res: http.IncomingMessage, body) => {
            if (error || res.statusCode !== 200) {
                return defer.reject('Http request failed');
            }

            var response: any = JSON.parse(body);
            var pullRequests: any = response.values;
            var result: Array<models.PullRequest> = this.getCollection<models.PullRequest>(factories.PullRequestFactory, pullRequests);

            var rest = this.getRequestPromises(this.getPagesList(response));
            q.all(rest).done((results: Array<any>) => {
                for (var resultIndex = 0; resultIndex < results.length; resultIndex++) {
                    var resultPrs: any = results[resultIndex];
                    result = result.concat(this.getCollection<models.PullRequest>(factories.PullRequestFactory, resultPrs));
                }

                PullRequestRepository.pullRequests[repository.fullName] = result;
                defer.resolve(result);
            });
        });

        return defer.promise;
    }

    findAll(): Array<models.PullRequest> {
        var foundPullRequests: Array<models.PullRequest> = [];
        for (var repositoryName in PullRequestRepository.pullRequests) {
            if (PullRequestRepository.pullRequests.hasOwnProperty(repositoryName)) {
                foundPullRequests = foundPullRequests.concat(PullRequestRepository.pullRequests[repositoryName]);
            }
        }

        return foundPullRequests;
    }

    findByReviewer(username: string): Array<models.PullRequest> {
        var foundPullRequests: Array<models.PullRequest> = [];
        for (var repositoryName in PullRequestRepository.pullRequests) {
            if (PullRequestRepository.pullRequests.hasOwnProperty(repositoryName)) {
                var prs = PullRequestRepository.pullRequests[repositoryName].filter((pr: models.PullRequest) => {
                    var reviewers = pr.reviewers;
                    for (var reviewerIndex = 0; reviewerIndex < reviewers.length; reviewerIndex++) {
                        var reviewer = reviewers[reviewerIndex];
                        if (reviewer.user.username === username) {
                            return true;
                        }
                    }

                    return false;
                });

                foundPullRequests = foundPullRequests.concat(prs);
            }
        }

        return foundPullRequests;
    }

    findByAuthor(username: string): Array<models.PullRequest> {
        var foundPullRequests: Array<models.PullRequest> = [];
        for (var repositoryName in PullRequestRepository.pullRequests) {
            if (PullRequestRepository.pullRequests.hasOwnProperty(repositoryName)) {
                var prs = PullRequestRepository.pullRequests[repositoryName].filter((pr: models.PullRequest) => {
                    return pr.author.username === username;
                });
                foundPullRequests = foundPullRequests.concat(prs);
            }
        }

        return foundPullRequests;
    }

    add(pullRequest: models.PullRequest): void {
        var repositoryName = pullRequest.targetRepository.fullName;
        if (!PullRequestRepository.pullRequests.hasOwnProperty(repositoryName)) {
            PullRequestRepository.pullRequests[repositoryName] = [];
        }
        PullRequestRepository.pullRequests[repositoryName].push(pullRequest);
    }
}
