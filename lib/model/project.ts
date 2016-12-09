import {ModelInterface} from "./model";

export class Project implements ModelInterface {
    name: string;
    fullName: string;
    pullRequestsUrl: string;
}
