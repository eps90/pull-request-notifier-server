///<reference path="../../typings/tsd.d.ts"/>

import http = require('http');
import logger = require('./../logger');
import eventPayloadHandler = require('./event_payload_handler');

export class WebhookListener {
    static createServer() {
        logger.info('Creating HTTP server');
        var server = http.createServer((req: http.IncomingMessage, res: http.ServerResponse) => {
            logger.info('Incoming HTTP request');

            if (req.method === 'POST') {
                var reqBody  = '';
                req.on('data', (chunk) => {
                    reqBody += chunk;
                });

                logger.info('Request decoded.');

                if (req.headers.hasOwnProperty('x-event-key')) {
                    var eventType = req.headers['x-event-key'];
                    logger.info("Request with event payload '%s'", eventType);
                    eventPayloadHandler.EventPayloadHandler.handlePayload(eventType, reqBody);
                } else {
                    logger.warn("Request does not contain 'x-event-key' header");
                }
            }

            req.on('end', () => {
                res.writeHead(200, 'OK');
                res.end();
            });
        });

        server.listen(8888);
        logger.info('HTTP server starts listening on port 8888');

        return server;
    }
}
