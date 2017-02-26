declare module faker {
    export var commerce: Dictionary.ICommerce;
    export var helpers: IHelpers;
    export var company: Dictionary.ICompany;
    export var internet: Dictionary.IInternet;
    export var name: Dictionary.IName;
    export var random: Dictionary.IRandom;
    export var lorem: Dictionary.ILorem;

    interface IHelpers {
        slugify(input: string): string;
        randomize<T>(elements: T[]): T;
    }

    module Dictionary {
        interface ICommerce {
            productName(): string;
        }

        interface ICompany {
            companyName(): string;
        }

        interface IInternet {
            url(): string;
            userName(): string;
        }

        interface IName {
            firstName(): string;
            lastName(): string;
        }

        interface IRandom {
            number(): number;
            boolean(): boolean;
        }

        interface ILorem {
            sentence(): string;
            paragraph(): string;
            paragraphs(): string;
        }
    }
}

declare module 'faker' {
    export = faker;
}
