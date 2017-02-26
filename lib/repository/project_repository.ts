import {AbstractRepository} from './abstract_repository';
import {Config} from "../config";
import {ProjectFactory} from "../factory/project";
import {Project} from "../model/project";
import * as q from 'q';

export class ProjectRepository extends AbstractRepository {
    static repositories: Project[] = [];

    static findAll(): Project[] {
        return ProjectRepository.repositories;
    }

    static fetchAll(): q.Promise<Project[]> {
        const config = Config.getConfig();
        const resourceUrl: string = 'repositories/' + config.teamName;
        return this.requestForAll(resourceUrl)
            .then((valuesDecoded: any[]) => {
                const projects: Project[] = [];
                for (let value of valuesDecoded) {
                    const project = ProjectFactory.create(value);
                    projects.push(project);
                }
                return projects;
            })
            .then((projects: Project[]) => {
                ProjectRepository.repositories = projects;
                return projects;
            });
    }
}
