///<reference path="../../typings/tsd.d.ts"/>

import http = require('http');
import logger = require('./../logger');
import eventPayloadHandler = require('./event_payload_handler');
import configModule = require('./../config');

export class WebhookListener {
    static createServer(): http.Server {
        logger.info('Creating HTTP server');
        var server = http.createServer((req: http.IncomingMessage, res: http.ServerResponse) => {
            logger.info('Incoming HTTP request');

            if (req.method === 'POST') {
                var reqBody  = '';
                req.on('data', (chunk) => {
                    reqBody += chunk;
                });

                req.on('end', () => {
                    logger.info('Request decoded');

                    if (req.headers.hasOwnProperty('x-event-key')) {
                        var eventType = req.headers['x-event-key'];
                        logger.info("Request with event payload", {event: eventType});
                        eventPayloadHandler.EventPayloadHandler.handlePayload(eventType, reqBody).then(() => {
                            res.writeHead(200, 'OK');
                            res.end();
                        });
                    } else {
                        logger.warn("Request does not contain 'x-event-key' header");
                        res.writeHead(200, 'OK');
                        res.end();
                    }
                });
            } else {
                req.on('end', () => {
                    res.writeHead(200, 'OK');
                    res.end();
                });
            }
        });

        var config = configModule.Config.getConfig();
        var webhookPort = config.webhook_port;
        server.listen(webhookPort);
        logger.info('HTTP server starts listening', {port: webhookPort.toString()});

        return server;
    }
}
