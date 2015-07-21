///<reference path="../typings/tsd.d.ts"/>

import chai = require('chai');
var expect = chai.expect;
import factories = require('./../lib/factories');

describe('Factories', () => {
    describe('ProjectFactory', () => {
        it('should create Project model from given config', () => {
            var rawObject: any = {
                name: 'my_repo',
                full_name: 'org/my_repo',
                links: {
                    pullrequests: {
                        href: 'http://example.com'
                    }
                }
            };

            var projectFactory = new factories.ProjectFactory();
            var project = projectFactory.create(rawObject);

            expect(project.fullName).to.eq('org/my_repo');
            expect(project.name).to.eq('my_repo');
            expect(project.pullRequestsUrl).to.eq('http://example.com');
        });
    });
});
