import {ModelInterface, PullRequest, Project, PullRequestState} from './model';
import {ProjectFactory, PullRequestFactory} from './factory';
import {Config} from "./config";
import {HttpRequestError} from "./errors";

// @todo Change to default export
import logger = require('./logger');

import * as request from 'request';
import * as q from 'q';
import * as _ from 'lodash';
import * as url from 'url';
import * as http from 'http';

// @todo Get rid of AbstractRepository and make its methods simple functions
class AbstractRepository {
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

export class ProjectRepository extends AbstractRepository {
    static repositories: Project[] = [];

    static findAll(): Project[] {
        return ProjectRepository.repositories;
    }

    static fetchAll(): q.Promise<Project[]> {
        const config = Config.getConfig();

        const resourceUrl: string = config.baseUrl + '/repositories/' + config.teamName;
        const requestConfig = {
            auth: {
                username: config.user,
                password: config.password
            }
        };

        const defer = q.defer<Project[]>();

        logger.logHttpRequestAttempt(resourceUrl);
        request(resourceUrl, requestConfig, (error, res: http.IncomingMessage, body) => {
            if (error || res.statusCode !== 200) {
                logger.logHttpRequestFailed(resourceUrl);
                return defer.reject(HttpRequestError.throwError(resourceUrl, res, body));
            }

            logger.logHttpRequestSucceed(resourceUrl);
            const response: any = JSON.parse(body);
            const repos: any = response.values;
            let result: Project[] = AbstractRepository.getCollection<Project>(ProjectFactory, repos);

            const rest = AbstractRepository.getRequestPromises(AbstractRepository.getPagesList(response), requestConfig);
            q.all(rest).done(
                (results: any[]) => {
                    for (let resultIndex = 0; resultIndex < results.length; resultIndex++) {
                        const resultRepos: any = results[resultIndex];
                        result = result.concat(this.getCollection<Project>(ProjectFactory, resultRepos));
                    }

                    ProjectRepository.repositories = result;

                    defer.resolve(result);
                },
                (err) => {
                    return defer.reject(err);
                }
            );
        });

        return defer.promise;
    }
}

interface PullRequestSet {
    [repositoryName: string]: PullRequest[];
}

export class PullRequestRepository extends AbstractRepository {
    static pullRequests: PullRequestSet = {};

    static findAll(): PullRequest[] {
        let foundPullRequests: PullRequest[] = [];
        for (let repositoryName in PullRequestRepository.pullRequests) {
            if (PullRequestRepository.pullRequests.hasOwnProperty(repositoryName)) {
                foundPullRequests = foundPullRequests.concat(PullRequestRepository.pullRequests[repositoryName]);
            }
        }

        return foundPullRequests;
    }

    static findByReviewer(username: string): PullRequest[] {
        let foundPullRequests: PullRequest[] = [];
        for (let repositoryName in PullRequestRepository.pullRequests) {
            if (PullRequestRepository.pullRequests.hasOwnProperty(repositoryName)) {
                const prs = PullRequestRepository.pullRequests[repositoryName].filter((pr: PullRequest) => {
                    const reviewers = pr.reviewers;
                    for (let reviewerIndex = 0; reviewerIndex < reviewers.length; reviewerIndex++) {
                        const reviewer = reviewers[reviewerIndex];
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

    static findByAuthor(username: string): PullRequest[] {
        let foundPullRequests: PullRequest[] = [];
        for (let repositoryName in PullRequestRepository.pullRequests) {
            if (PullRequestRepository.pullRequests.hasOwnProperty(repositoryName)) {
                const prs = PullRequestRepository.pullRequests[repositoryName].filter((pr: PullRequest) => {
                    return pr.hasOwnProperty('author') && pr.author.username === username;
                });
                foundPullRequests = foundPullRequests.concat(prs);
            }
        }

        return foundPullRequests;
    }

    static findByUser(username: string): PullRequest[] {
        const result = this.findByAuthor(username).concat(this.findByReviewer(username));
        return _.uniq(result, (element: PullRequest) => {
            return element.targetRepository.fullName + '#' + element.id;
        });
    }

    static add(pullRequest: PullRequest): void {
        const repositoryName = pullRequest.targetRepository.fullName;
        if (!PullRequestRepository.pullRequests.hasOwnProperty(repositoryName)) {
            PullRequestRepository.pullRequests[repositoryName] = [];
        }
        PullRequestRepository.pullRequests[repositoryName].push(pullRequest);
    }

    static update(pullRequest: PullRequest): void {
        if (pullRequest.state !== PullRequestState.Open) {
            return this.remove(pullRequest);
        }

        const projectName = pullRequest.targetRepository.fullName;
        const projectPrs = this.pullRequests[projectName] || [];
        for (let prIndex = 0; prIndex < projectPrs.length; prIndex++) {
            const currentPullRequest: PullRequest = projectPrs[prIndex];
            if (currentPullRequest.id === pullRequest.id) {
                this.pullRequests[projectName].splice(prIndex, 1, pullRequest);
                return;
            }
        }

        this.add(pullRequest);
    }

    static remove(pullRequest: PullRequest): void {
        const projectName = pullRequest.targetRepository.fullName;
        const projectPrs = this.pullRequests[projectName] || [];
        for (let prIndex = 0; prIndex < projectPrs.length; prIndex++) {
            const currentPullRequest: PullRequest = projectPrs[prIndex];
            if (currentPullRequest.id === pullRequest.id) {
                this.pullRequests[projectName].splice(prIndex, 1);
                return;
            }
        }
    }

    // @todo to refactor
    static fetchByProject(project: Project): q.Promise<PullRequest[]> {
        const parsedUrl = url.parse(project.pullRequestsUrl);
        const config = Config.getConfig();

        const requestConfig = {
            auth: {
                username: config.user,
                password: config.password
            }
        };

        delete parsedUrl.search;
        parsedUrl.query = {
            state: 'OPEN'
        };
        const pullRequestsUrl = url.format(parsedUrl);

        const defer = q.defer<PullRequest[]>();

        logger.logHttpRequestAttempt(pullRequestsUrl);
        request(pullRequestsUrl, requestConfig, (error, res: http.IncomingMessage, body) => {
            if (error || res.statusCode !== 200) {
                logger.logHttpRequestFailed(pullRequestsUrl);
                return defer.reject(HttpRequestError.throwError(pullRequestsUrl, res, body));
            }
            logger.logHttpRequestSucceed(pullRequestsUrl);

            const response: any = JSON.parse(body);
            const pullRequests: any[] = response.values;
            let result: PullRequest[] = AbstractRepository.getCollection<PullRequest>(PullRequestFactory, pullRequests);

            q.all(
                result.map((pr: PullRequest) => {
                    const deferred = q.defer();

                    logger.logHttpRequestAttempt(pr.links.self);
                    request(pr.links.self, requestConfig, (err, httpRes: http.IncomingMessage, innerBody) => {
                        if (error || httpRes.statusCode !== 200) {
                            logger.logHttpRequestFailed(pr.links.self);
                            return deferred.reject(HttpRequestError.throwError(pr.links.self, httpRes, innerBody));
                        }

                        logger.logHttpRequestSucceed(pr.links.self);
                        const innerResponse = JSON.parse(innerBody);
                        deferred.resolve(PullRequestFactory.create(innerResponse));
                    });

                    return deferred.promise;
                })
            ).then((prs: PullRequest[]) => {
                    result = prs;
                    const rest = AbstractRepository.getRequestPromises(AbstractRepository.getPagesList(response), requestConfig);
                    q.all(rest).done((results: any[]) => {
                        for (let resultIndex = 0; resultIndex < results.length; resultIndex++) {
                            const resultPrs: any = results[resultIndex];
                            result = result.concat(this.getCollection<PullRequest>(PullRequestFactory, resultPrs));
                        }

                        PullRequestRepository.pullRequests[project.fullName] = result;
                        defer.resolve(result);
                    });
                });
        });

        return defer.promise;
    }

    static fetchOne(pullRequestUrl: string): q.Promise<PullRequest>;
    static fetchOne(project: Project, prId: number): q.Promise<PullRequest>;

    static fetchOne(projectOrUrl: any, prId?: number): q.Promise<PullRequest> {
        const deferred = q.defer<PullRequest>();
        const config = Config.getConfig();
        let prUrl = '';

        if (typeof projectOrUrl === 'string') {
            prUrl = projectOrUrl;
        } else {
            prUrl = config.baseUrl + '/repositories/' + projectOrUrl.fullName + '/pullrequests/' + prId;
        }

        const requestConfig = {
            auth: {
                username: config.user,
                password: config.password
            }
        };

        logger.logHttpRequestAttempt(prUrl);
        request(prUrl, requestConfig, (error, res: http.IncomingMessage, body) => {
            if (error || res.statusCode !== 200) {
                logger.logHttpRequestFailed(prUrl);
                return deferred.reject(HttpRequestError.throwError(prUrl, res, body));
            }
            logger.logHttpRequestSucceed(prUrl);

            const response: any = JSON.parse(body);
            const pullRequest = PullRequestFactory.create(response);
            deferred.resolve(pullRequest);
        });

        return deferred.promise;
    }
}
