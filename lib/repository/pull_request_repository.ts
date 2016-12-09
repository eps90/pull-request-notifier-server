import {AbstractRepository} from "./abstract_repository";
import {PullRequest} from "../model/pull_request";
import {PullRequestState} from "../model/pull_request_state";
import * as url from 'url';
import * as q from 'q';
// @todo Change to default export
import logger = require("./../logger");
import * as http from 'http';
import {PullRequestFactory} from "../factory/pull_request";
import {Project} from "../model/project";
import {Config} from "../config";
import {HttpRequestError} from "../errors";
import * as request from 'request';
import * as _ from 'lodash';

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
