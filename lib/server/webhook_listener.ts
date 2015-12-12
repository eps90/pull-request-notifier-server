///<reference path="../../typings/tsd.d.ts"/>

import http = require('http');
import logger = require('./../logger');
import eventPayloadHandler = require('./event_payload_handler');
import configModule = require('./../config');

export class WebhookListener {
    static createServer(): http.Server {
        logger.logHttpServerStart();
        var server = http.createServer((req: http.IncomingMessage, res: http.ServerResponse) => {
            logger.logIncomingHttpRequest();

            if (req.method === 'POST') {
                var reqBody  = '';
                req.on('data', (chunk) => {
                    reqBody += chunk;
                });

                req.on('end', () => {
                    logger.logRequestDecoded();

                    if (req.headers.hasOwnProperty('x-event-key')) {
                        var eventType = req.headers['x-event-key'];
                        logger.logRequestWithPayload(eventType);
                        eventPayloadHandler.EventPayloadHandler.handlePayload(eventType, reqBody).then(() => {
                            res.writeHead(200, 'OK');
                            res.end();
                        });
                    } else {
                        logger.logRequestWithNoEvent();
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
        logger.logHttpServerStartListening(webhookPort.toString());

        return server;
    }
}
