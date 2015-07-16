/// <reference path="../typings/tsd.d.ts" />

export class Repository {
    name = '';
    fullName = '';

    constructor(repoObject?: any) {
        if (repoObject.hasOwnProperty('name')) {
            this.name = repoObject.name;
        }

        if (repoObject.hasOwnProperty('full_name')) {
            this.fullName = repoObject.full_name;
        }
    }
}
