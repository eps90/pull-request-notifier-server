///<reference path="../typings/tsd.d.ts"/>

import models = require('./../lib/models');
import repositories = require('./../lib/repositories');
import nock = require('nock');
import chai = require('chai');
var expect = chai.expect;

describe("Repositories", () => {
    describe("ProjectRepository", () => {
        it('should create list of projects by requesting them', (done) => {
            var config:any = {
                size: 29,
                pagelen: 10,
                next: 'http://example.com/repositories/bitbucket?page=2',
                values: [
                    {
                        'name': 'my_repo',
                        'full_name': 'org/my_repo'
                    }
                ]
            };

            var configNextPage:any = {
                values: [
                    {
                        'name': 'another_repo',
                        'full_name': 'org/another_repo'
                    }
                ]
            };

            var thirdPage:any = {
                values: [
                    {
                        'name': 'aaaa',
                        'full_name': 'bbbb'
                    }
                ]
            };

            nock('http://example.com')
                .get('/repositories/bitbucket')
                .reply(200, JSON.stringify(config));

            nock('http://example.com')
                .get('/repositories/bitbucket')
                .query({page: '2'})
                .reply(200, JSON.stringify(configNextPage));

            nock('http://example.com')
                .get('/repositories/bitbucket')
                .query({page: '3'})
                .reply(200, JSON.stringify(thirdPage));

            var projectRepository = new repositories.ProjectRepository('http://example.com');
            projectRepository.findAll((repos: Array<models.Repository>) => {
                expect(repos).to.have.length(3);
                var repository:models.Repository = repos[0];
                expect(repository).to.be.instanceOf(models.Repository);
                expect(repository.name).to.eq('my_repo');
                expect(repository.fullName).to.eq('org/my_repo');

                var anotherRepository:models.Repository = repos[1];
                expect(anotherRepository).to.be.instanceOf(models.Repository);
                expect(anotherRepository.name).to.eq('another_repo');
                expect(anotherRepository.fullName).to.eq('org/another_repo');

                var thirdRepository:models.Repository = repos[2];
                expect(thirdRepository).to.be.instanceOf(models.Repository);
                expect(thirdRepository.name).to.eq('aaaa');
                expect(thirdRepository.fullName).to.eq('bbbb');

                done();
            });
        });
    });
});
