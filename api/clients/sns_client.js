/*jshint esversion: 6 */
'use strict';

const AWS = require('aws-sdk');
const Promise = require('bluebird');


class SnsClient {
    constructor() {}

    init(account) {
        this.sns = Promise.promisifyAll(new AWS.SNS(account));
    }

    createTopic(topic_name) {
        return this.sns.createTopicAsync({
                Name: topic_name
            })
            .then(topic => {
                return topic.TopicArn;
            });
    }

    confirmSubscription(params) {
        return this.sns.confirmSubscriptionAsync({
            Token: params.token,
            TopicArn: params.topic_arn,
            AuthenticateOnUnsubscribe: 'false'
        });
    }

    subscribe(params) {
        return this.sns.subscribeAsync({
            Protocol: params.Protocol,
            TopicArn: params.TopicArn,
            Endpoint: params.Endpoint
        });
    }

    addPermission(params) {

        return this.sns.addPermissionAsync({
            AWSAccountId: [
                params.AccountId,
            ],
            ActionName: [
                'Publish'
            ],
            Label: [params.name, 'sns'].join('-'),
            TopicArn: params.TopicArn
        });
    }

    removePermission(params) {
        return this.sns.removePermissionAsync({
            Label: [params.name, 'sns'].join('-'),
            TopicArn: params.TopicArn
        });
    }
}

module.exports = new SnsClient();
