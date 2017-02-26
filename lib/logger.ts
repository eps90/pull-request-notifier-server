import winston = require('winston');
import {TransportOptions} from "winston";
import {PullRequest} from "./model/pull_request";
/* tslint:disable */
require('winston-loggly');
/* tslint:enable */

export default class Logger {
    private static logger: winston.LoggerInstance;

    static getLogger(): winston.LoggerInstance {
        if (!this.logger) {
            this.initLogger();
        }

        return this.logger;
    }

    static logHttpRequestAttempt(targetUrl: string): void {
        this.getLogger().info('About to make an HTTP request', {targetUrl: targetUrl});
    }

    static logHttpRequestSucceed(targetUrl: string): void {
        this.getLogger().info('Http request succeeded', {targetUrl: targetUrl});
    }

    static logHttpRequestFailed(targetUrl: string): void {
        this.getLogger().error('Http request failed', {targetUrl: targetUrl});
    }

    static logLoadingConfigFile(filePath: string): void {
        this.getLogger().info('Loading config file', {configFile: filePath});
    }

    static logInitializingPullRequests(): void {
        this.getLogger().info('Initializing pull requests');
    }

    static logPullRequestsInitialized(pullRequestsCount: number): void {
        this.getLogger().info(
            'Pull request collection initialized',
            {pullRequestCount: pullRequestsCount}
        );
    }

    static logInitializationFailed(): void {
        this.getLogger().error('Initialization failed');
    }

    static logNewEventDispatcherInstance(): void {
        this.getLogger().info('Creating new instance of EventDispatcher');
    }

    static logUnhandledEventPayload(event: string): void {
        this.getLogger().warn('Unhandled event payload', {event: event});
    }

    static logAddPullRequestToRepository(): void {
        this.getLogger().info('Adding a pull request to the repository');
    }

    static logUpdatingPullRequest(): void {
        this.getLogger().info('Updating a pull request');
    }

    static logClosingPullRequest(): void {
        this.getLogger().info('Closing a pull request');
    }

    static logSocketServerStart(port: string): void {
        this.getLogger().info('Starting socket.io server', {port: port});
    }

    static logClientConnected(): void {
        this.getLogger().info('Client connected');
    }

    static logClientIntroduced(username: string): void {
        this.getLogger().info('Client introduced', {username: username});
    }

    static logEmittingEventToUser(event: string, username: string): void {
        this.getLogger().info('Emitting event', {event: event, username: username});
    }

    static logReminderReceived(): void {
        this.getLogger().info('Reminder for a pull request received');
    }

    static logSendingReminderToUser(username: string): void {
        this.getLogger().info('Sending a reminder', {username: username});
    }

    static logWebhookEventReceived(event: string): void {
        this.getLogger().info('Webhook event received', {event: event});
    }

    static logHttpServerStart(): void {
        this.getLogger().info('Creating HTTP server');
    }

    static logIncomingHttpRequest(): void {
        this.getLogger().info('Incoming HTTP request');
    }

    static logRequestDecoded(request: string): void {
        var requestMessage: any;
        try {
            requestMessage = JSON.parse(request);
        } catch (e) {
            requestMessage = request;
        }

        this.getLogger().info('HTTP request decoded', {request: requestMessage});
    }

    static logRequestWithPayload(event: string): void {
        this.getLogger().info('Received HTTP request with event payload', {event: event});
    }

    static logHttpServerStartListening(port: string): void {
        this.getLogger().info('Http server starts listening', {port: port});
    }

    static logRequestWithNoEvent(request: string): void {
        let requestMessage: any;
        try {
            requestMessage = JSON.parse(request);
        } catch (e) {
            requestMessage = request;
        }

        this.getLogger().warn("The HTTP request does not contain 'x-event-key' header", {request: requestMessage});
    }

    static logUnsupportedRequestMethod(method: string): void {
        this.getLogger().warn('Unsupported HTTP request method', {method: method});
    }

    static logSinglePullRequestUpdated(pullRequest: PullRequest) {
        this.getLogger().info(`Pull request ${pullRequest.title} updated`, {pullRequest: pullRequest});
    }

    static logSendingUpdateNotification(pullRequest: PullRequest, receipient: string) {
        this.getLogger().info(`Sending update notification for ${pullRequest.title} to ${receipient}`);
    }

    private static initLogger(): void {
        // unfortunately, these things cannot be in config because it will cause circular reference errors
        const tokenEnvKey = 'BBNOTIFIER_LOGGLY_TOKEN';
        const subdomainEnvKey = 'BBNOTIFIER_LOGGLY_SUBDOMAIN';
        const logglyToken = process.env[tokenEnvKey] || 'token';
        const logglySubdomain = process.env[subdomainEnvKey] || 'subdomain';

        const logger: winston.LoggerInstance = new (winston.Logger)({
            transports: [
                new (winston.transports.Console)(),
                new (winston.transports.Loggly)(<TransportOptions>{
                    token: logglyToken,
                    subdomain: logglySubdomain,
                    tags: ["nodejs", "Bitbucket-Notifier"],
                    json: true,
                    handleExceptions: true,
                    humanReadableUnhandledException: true
                })
            ]
        });

        logger.cli();
        this.logger = logger;
    }
}
