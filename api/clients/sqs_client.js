/*jshint esversion: 6 */
'use strict';

const Promise = require('bluebird');
const AWS = require('aws-sdk');
const logger = require('../../utls/logger.js');

class SqsClient {
    constructor() {}

    init(account) {
        this.sqs = Promise.promisifyAll(new AWS.SQS(account));
    }

    createQueue(QueueName) {

        logger.info(`Creating new queue: ${QueueName}`);

        return this.sqs.createQueueAsync({
                QueueName: QueueName
            })
            .then(queue => {
                return queue.QueueUrl;
            });
    }

    getQueueUrl(QueueName) {
        return this.sqs.getQueueUrlAsync({
            QueueName: QueueName
        });
    }

    getQueueArn(queue_url) {
        return this.sqs.getQueueAttributesAsync({
                QueueUrl: queue_url,
                AttributeNames: ['QueueArn']
            })
            .then(response => {
                return response.Attributes.QueueArn;
            });
    }

    getMessage(queue_url) {
        return this.sqs.receiveMessageAsync({
                QueueUrl: queue_url,
                WaitTimeSeconds: 20,
                MaxNumberOfMessages: 10,
                VisibilityTimeout: 5,
                MessageAttributeNames: ['.']
            })
            .then(response => {
                return response.Messages;
            });
    }

    deleteMessage(params) {
        return this.sqs.deleteMessageAsync(params);
    }
}

module.exports = new SqsClient();
