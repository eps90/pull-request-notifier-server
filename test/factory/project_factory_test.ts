import {expect} from 'chai';
import {ProjectFactory} from "../../lib/factory/project";

describe('ProjectFactory', () => {
    it('should create Project model from given config', () => {
        const rawObject: any = {
            uuid: '{c2d59b40-681b-48a1-b2fd-bf523bd6b1bc}',
            name: 'my_repo',
            full_name: 'org/my_repo',
            links: {
                pullrequests: {
                    href: 'http://example.com'
                }
            }
        };

        const project = ProjectFactory.create(rawObject);

        expect(project.uuid).to.eq('{c2d59b40-681b-48a1-b2fd-bf523bd6b1bc}');
        expect(project.fullName).to.eq('org/my_repo');
        expect(project.name).to.eq('my_repo');
        expect(project.pullRequestsUrl).to.eq('http://example.com');
    });
});

