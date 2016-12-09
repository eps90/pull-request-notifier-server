import {AbstractRepository} from './abstract_repository';
import {Config} from "../config";
import {HttpRequestError} from "../errors";
import {ProjectFactory} from "../factory/project";
import {Project} from "../model/project";
// @todo Change to default export
import logger = require ("./../logger");
import * as q from 'q';
import * as http from 'http';
import * as request from 'request';

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
