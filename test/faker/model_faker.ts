import * as faker from 'faker';
import * as models from './../../lib/models';

abstract class AbstractFaker<T> {
    abstract getObject(): T;

    fake(defaultProperties: any = {}): T {
        var model: T = this.getObject();

        function isObject(variable): boolean {
            return Object.prototype.toString.call(variable) === '[object Object]';
        }

        function setProperties(properties, target) {
            for (var prop in properties) {
                if (properties.hasOwnProperty(prop) && target.hasOwnProperty(prop)) {
                    if (isObject(properties[prop])) {
                        setProperties(properties[prop], target[prop])
                    } else {
                        target[prop] = properties[prop];
                    }
                }
            }
        }

        setProperties(defaultProperties, model);

        return model;
    }

    fakeList(numberOfElements: number = 2): T[] {
        var result: T[] = [];

        for (let i = 0; i < numberOfElements; i++) {
            result.push(this.getObject());
        }

        return result;
    }
}

export class ProjectFaker extends AbstractFaker<models.Project> {
    getObject(): models.Project {
        var project = new models.Project();
        project.fullName = this.fullName;
        project.name = this.name;
        project.pullRequestsUrl = this.pullRequestsUrl;

        return project;
    }

    get name(): string {
        return faker.commerce.productName();
    }
    get fullName(): string {
        var companyName = faker.helpers.slugify(faker.company.companyName()).toLowerCase();
        var productName = faker.helpers.slugify(faker.commerce.productName()).toLowerCase();

        return `${companyName}/${productName}`;
    }

    get pullRequestsUrl(): string {
        return faker.internet.url();
    }
}

export class UserFaker extends AbstractFaker<models.User> {
    getObject(): models.User {
        var user = new models.User();
        user.displayName = this.displayName;
        user.username = this.username;

        return user;
    }

    get username(): string {
        return faker.internet.userName();
    }

    get displayName(): string {
        var firstName = faker.name.firstName();
        var lastName = faker.name.lastName();

        return `${firstName} ${lastName}`;
    }
}

export class ReviewerFaker extends AbstractFaker<models.Reviewer> {
    getObject(): models.Reviewer {
        var reviewer = new models.Reviewer();
        reviewer.approved = this.approved;
        reviewer.user = this.user;

        return reviewer;
    }

    get approved(): boolean {
        return faker.random.boolean();
    }

    get user(): models.User {
        var userFaker = new UserFaker();
        return userFaker.getObject();
    }
}

export class PullRequestStateFaker extends AbstractFaker<models.PullRequestState> {
    getObject(): models.PullRequestState {
        var states: models.PullRequestState[] = [
            models.PullRequestState.Open,
            models.PullRequestState.Merged,
            models.PullRequestState.Declined
        ];

        return faker.helpers.randomize<models.PullRequestState>(states);
    }
}

export class PullRequestLinksFaker extends AbstractFaker<models.PullRequestLinks> {
    getObject(): models.PullRequestLinks {
        var links = new models.PullRequestLinks();
        links.self = this.self;
        links.html = this.html;

        return links;
    }

    get self(): string {
        return faker.internet.url();
    }

    get html(): string {
        return faker.internet.url();
    }
}

export class PullRequestFaker extends AbstractFaker<models.PullRequest> {
    getObject(): models.PullRequest {
        var pullRequest = new models.PullRequest();
        pullRequest.id = this.id;
        pullRequest.title = this.title;
        pullRequest.description = this.description;
        pullRequest.author = this.author;
        pullRequest.reviewers = this.reviewers;
        pullRequest.targetRepository = this.targetRepository;
        pullRequest.targetBranch = this.targetBranch;
        pullRequest.state = this.state;
        pullRequest.links = this.links;

        return pullRequest;
    }

    get id(): number {
        return faker.random.number();
    }

    get title(): string {
        return faker.lorem.sentence();
    }

    get description(): string {
        return faker.lorem.paragraph();
    }

    get author(): models.User {
        var user = new UserFaker();
        return user.getObject();
    }

    get targetRepository(): models.Project {
        var project = new ProjectFaker();
        return project.getObject();
    }

    get targetBranch(): string {
        var branches = ['master', 'develop', 'new-branch'];
        return faker.helpers.randomize<string>(branches);
    }

    get reviewers(): models.Reviewer[] {
        var reviewer = new ReviewerFaker();
        return reviewer.fakeList();
    }

    get state(): models.PullRequestState {
        var state = new PullRequestStateFaker();
        return state.getObject();
    }

    get links(): models.PullRequestLinks {
        var links = new PullRequestLinksFaker();
        return links.getObject();
    }
}
