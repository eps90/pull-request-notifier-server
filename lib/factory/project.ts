import {Project} from "../model/project";

export class ProjectFactory {
    static create(rawObject: any): Project {
        const project = new Project();

        if (rawObject.hasOwnProperty('name')) {
            project.name = rawObject.name;
        }

        if (rawObject.hasOwnProperty('full_name')) {
            project.fullName = rawObject.full_name;
        }

        if (rawObject.hasOwnProperty('links')) {
            const links = rawObject.links;
            if (links.hasOwnProperty('pullrequests')) {
                project.pullRequestsUrl = rawObject.links.pullrequests.href;
            }
        }

        return project;
    }
}
