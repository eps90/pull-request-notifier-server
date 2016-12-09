import {expect} from 'chai';
import {ProjectFactory} from "../../lib/factory/project";

describe('ProjectFactory', () => {
    it('should create Project model from given config', () => {
        const rawObject: any = {
            name: 'my_repo',
            full_name: 'org/my_repo',
            links: {
                pullrequests: {
                    href: 'http://example.com'
                }
            }
        };

        const project = ProjectFactory.create(rawObject);

        expect(project.fullName).to.eq('org/my_repo');
        expect(project.name).to.eq('my_repo');
        expect(project.pullRequestsUrl).to.eq('http://example.com');
    });
});

