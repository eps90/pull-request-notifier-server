import {ProjectRepository} from "../../lib/repository/project_repository";
import {Project} from "../../lib/model/project";
import {Config} from "../../lib/config";
import * as nock from "nock";
import * as chai from 'chai';
import chaiAsPromised  = require('chai-as-promised');

describe("ProjectRepository", () => {
    const expect = chai.expect;
    const basicAuth = {
        user: 'my.user',
        pass: 'topsecret'
    };

    beforeEach(() => {
        chai.use(chaiAsPromised);
        ProjectRepository.repositories = [];

        const appConfig = {
            baseUrl: 'http://example.com',
            teamName: 'bitbucket',
            user: 'my.user',
            password: 'topsecret',
            webhook_port: 1234,
            socket_port: 4321
        };

        Config.setUp({config: appConfig});
    });

    afterEach(() => {
        nock.cleanAll();
        Config.reset();
    });

    it('should create list of projects by requesting them', (done) => {
        const config: any = {
            next: 'http://example.com/repositories/bitbucket?page=2',
            values: [
                {
                    'name': 'my_repo',
                    'full_name': 'org/my_repo'
                }
            ]
        };

        const configNextPage: any = {
            next: 'http://example.com/repositories/bitbucket?page=3',
            values: [
                {
                    'name': 'another_repo',
                    'full_name': 'org/another_repo'
                }
            ]
        };

        const thirdPage: any = {
            values: [
                {
                    'name': 'aaaa',
                    'full_name': 'bbbb'
                }
            ]
        };

        nock('http://example.com')
            .get('/repositories/bitbucket')
            .basicAuth(basicAuth)
            .reply(200, JSON.stringify(config));

        nock('http://example.com')
            .get('/repositories/bitbucket')
            .query({page: '2'})
            .basicAuth(basicAuth)
            .reply(200, JSON.stringify(configNextPage));

        nock('http://example.com')
            .get('/repositories/bitbucket')
            .query({page: '3'})
            .basicAuth(basicAuth)
            .reply(200, JSON.stringify(thirdPage));

        ProjectRepository.fetchAll()
            .then((repos: Project[]) => {
                expect(repos).to.have.length(3);
                const repository: Project = repos[0];
                expect(repository).to.be.instanceOf(Project);
                expect(repository.name).to.eq('my_repo');
                expect(repository.fullName).to.eq('org/my_repo');

                const anotherRepository: Project = repos[1];
                expect(anotherRepository).to.be.instanceOf(Project);
                expect(anotherRepository.name).to.eq('another_repo');
                expect(anotherRepository.fullName).to.eq('org/another_repo');

                const thirdRepository: Project = repos[2];
                expect(thirdRepository).to.be.instanceOf(Project);
                expect(thirdRepository.name).to.eq('aaaa');
                expect(thirdRepository.fullName).to.eq('bbbb');

                expect(ProjectRepository.repositories).to.eq(repos);

                done();
            })
            .catch((error) => {
                done(error);
            });
    });

    it('should throw an error when request has failed', (done) => {
        nock('http://example.com')
            .get('/repositories/bitbucket')
            .basicAuth(basicAuth)
            .replyWithError('something wrong happened');

        expect(ProjectRepository.fetchAll()).to.be.rejectedWith(Error).and.notify(done);
    });

    it('should thrown an error when one of subrequests failed', (done) => {
        const config: any = {
            size: 19,
            pagelen: 10,
            next: 'http://example.com/repositories/bitbucket?page=2',
            values: [
                {
                    'name': 'my_repo',
                    'full_name': 'org/my_repo'
                }
            ]
        };

        nock('http://example.com')
            .get('/repositories/bitbucket')
            .basicAuth(basicAuth)
            .reply(200, config);

        nock('http://example.com')
            .get('/repositories/bitbucket')
            .query({page: '2'})
            .basicAuth(basicAuth)
            .replyWithError('something wrong happened');

        expect(ProjectRepository.fetchAll()).to.be.rejectedWith(Error).and.notify(done);
    });

    it('should throw an error when request has returned non-successful response code', (done) => {
        nock('http://example.com')
            .get('/repositories/bitbucket')
            .basicAuth(basicAuth)
            .reply(403, 'Forbidden');

        expect(ProjectRepository.fetchAll()).to.be.rejectedWith(Error).and.notify(done);
    });

    it('should throw an error when on of subrequests has return non-successful response code', (done) => {
        const config: any = {
            size: 19,
            pagelen: 10,
            next: 'http://example.com/repositories/bitbucket?page=2',
            values: [
                {
                    'name': 'my_repo',
                    'full_name': 'org/my_repo'
                }
            ]
        };

        nock('http://example.com')
            .get('/repositories/bitbucket')
            .basicAuth(basicAuth)
            .reply(200, config);

        nock('http://example.com')
            .get('/repositories/bitbucket')
            .query({page: '2'})
            .basicAuth(basicAuth)
            .reply(400, 'something went wrong');

        expect(ProjectRepository.fetchAll()).to.be.rejectedWith(Error).and.notify(done);
    });

    it('should find all known repositories', () => {
        const projects = [new Project(), new Project()];
        ProjectRepository.repositories = projects;
        const foundRepos = ProjectRepository.findAll();
        expect(foundRepos).to.equal(projects);
    });
});
