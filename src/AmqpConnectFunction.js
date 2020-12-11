"use strict";
var amqp = require('amqplib/callback_api');
const { v4: uuidv4 } = require('uuid');

// Emitter
const EventEmitter = require('events');
class AmqpEmitter extends EventEmitter { }
const amqpEmitter = new AmqpEmitter();

let amqpConn = null;

//channels
let channelPublish = null;
let channelPublish_exchangeTopic = null;

let channelSubscribe = null;
let channelSubscribe_exchangeTopic = null;
let routingKeySubscribe = ["#"]

let channelQueueSimpleSend = null;
let channelQueueSimpleSendName = null;

let channelQueueSimpleReceive = null;
let channelQueueSimpleReceiveName = null;


let channelRpcServer = null;
let channelRpcServerName = null;

let channelRpcClient = null;
let channelRpcClientName = null;
let channelRpcClientReplyQueueName = null;


function connect(host) {
    amqp.connect(host, function (err, connection) {
        if (err) {
            console.error("[AMQP]", err.message);
            return setTimeout(start, 1000);
        }

        connection.on("error", function (err) {
            if (err.message !== "Connection closing") {
                console.error("[AMQP] conn error", err.message);
            }
        });

        connection.on("close", function () {
            console.error("[AMQP] reconnecting");
            return setTimeout(connect(), 1000);
        });
        createChannelPublish(connection);
        createChannelQueueSimpleSend(connection);
        createChannelSubscribe(connection);
        createChannelQueueSimpleReceive(connection);
        createChannelRpcServer(connection);
        createChannelRpcClient(connection);
        console.log("[AMQP] connected.");
        amqpConn = connection;
    });
}

function disconnect() {
    if (amqpConn)
        amqpConn.close();
}

function createChannelPublish(connection) {

    if (!channelPublish_exchangeTopic)
        return;
    connection.createChannel(function (error1, channel) {
        if (error1) {
            throw error1;
        }
        channel.assertExchange(channelPublish_exchangeTopic, 'topic', {
            durable: false
        });

        channelPublish = channel;
        console.log("Channle:", channelPublish_exchangeTopic);
    });
}

function createChannelSubscribe(connection) {
    if (!channelSubscribe_exchangeTopic)
        return;
    connection.createChannel(function (error1, channel) {
        if (error1) {
            throw error1;
        }
        channel.assertExchange(channelSubscribe_exchangeTopic, 'topic', {
            durable: false
        });

        //TODO: maxLength
        channel.assertQueue('', {
            exclusive: true,
            durable: false
        }, function (error2, q) {
            if (error2) {
                throw error2;
            }

            routingKeySubscribe.forEach(function (routing_key) {
                channel.bindQueue(q.queue, channelSubscribe_exchangeTopic, routing_key);
            });

            channel.consume(q.queue, function (msg) {
                amqpEmitter.emit('topic_subscribe_receive', { routingKey: msg.fields.routingKey, data: JSON.parse(msg.content.toString()) });
            }, {
                noAck: true
            });
        });

        channelSubscribe = channel;
        console.log("Channel subscribe:", channelSubscribe_exchangeTopic);
    });
}

function createChannelQueueSimpleSend(connection) {
    if (!channelQueueSimpleSendName)
        return;
    connection.createChannel(function (error1, channel) {
        if (error1) {
            throw error1;
        }
        //TODO: maxLength
        channel.assertQueue(channelQueueSimpleSendName, {
            durable: false
        });

        channelQueueSimpleSend = channel;
        console.log("Channle:", channelQueueSimpleSendName);
    });
}
function createChannelQueueSimpleReceive(connection) {
    if (!channelQueueSimpleReceiveName)
        return;
    connection.createChannel(function (error1, channel) {
        if (error1) {
            throw error1;
        }
        //TODO: maxLength
        channel.assertQueue(channelQueueSimpleReceiveName, {
            durable: false
        });

        channel.consume(channelQueueSimpleReceiveName, function (msg) {


            amqpEmitter.emit('queue_simple_receive', JSON.parse(msg.content.toString()));
        }, {
            noAck: true
        });

        channelQueueSimpleReceive = channel;
        console.log("Channle:", channelQueueSimpleReceiveName);
    });
}



function createChannelRpcServer(connection) {
    if (!channelRpcServerName)
        return;
    connection.createChannel(function (error1, channel) {
        if (error1) {
            throw error1;
        }
        //TODO: maxLength
        channel.assertQueue(channelRpcServerName, {
            durable: false
        });
        channel.consume(channelRpcServerName, async function reply(msg) {

            var n = parseInt(msg.content.toString());

            let data = JSON.parse(msg.content.toString());

            console.log('Received event1:', data);

            //amqpEmitter.emit('queue_rpc_receive', data);
            rpcPromises(data)
                .then(data => {
                    console.log('Received event2:', data);
                    channel.sendToQueue(msg.properties.replyTo,
                        Buffer.from(JSON.stringify(data)), {
                        correlationId: msg.properties.correlationId
                    });
                    channel.ack(msg);
                })
                .catch(e => {
                    console.log('Error event2:', e);
                    channel.sendToQueue(msg.properties.replyTo,
                        Buffer.from(JSON.stringify(e)), {
                        correlationId: msg.properties.correlationId
                    });
                    channel.ack(msg);
                })
        });

        channelRpcServer = channel;
        console.log("Channle:", channelRpcServerName);
    });
}
function rpcPromises(data) {

    let res = { error: "Callback not registerd." };
    console.log('Error:', res);
    return new Promise((resolve, reject) => {
        reject(res);
    });

}

function createChannelRpcClient(connection) {
    if (!channelRpcClientName)
        return;
    connection.createChannel(function (error1, channel) {
        if (error1) {
            throw error1;
        }

        channel.assertQueue('', {
            exclusive: true
        }, function (error2, q) {
            if (error2) {
                throw error2;
            }

            channel.consume(q.queue, function (msg) {
                amqpEmitter.emit('queue_rpc_receive_back', msg.properties.correlationId, JSON.parse(msg.content.toString()));
            }, {
                noAck: true
            });

            channelRpcClientReplyQueueName = q.queue;
        });

        channelRpcClient = channel;
        console.log("Channle:", channelRpcClientName);
    });
}

function sendRpc(data) {

    if (!channelRpcClient || !channelRpcClientReplyQueueName)
        return;

    let correlationId_local = uuidv4();
    return new Promise((resolve, reject) => {
        amqpEmitter.once('queue_rpc_receive_back', (correlationId, data) => {
            if (correlationId_local === correlationId)
                resolve(data);
        });
        channelRpcClient.sendToQueue(channelRpcClientName, Buffer.from(JSON.stringify(data)), {
            correlationId: correlationId_local,
            replyTo: channelRpcClientReplyQueueName
        });

        // TODO: handle if the we do not get response
        //setTimeout(sendData,1000);

    });
}

function send2queue(data) {

    if (!channelQueueSimpleSend)
        return;
    try {
        channelQueueSimpleSend.sendToQueue(channelQueueSimpleSendName, Buffer.from(JSON.stringify(data)));
    }
    catch (e) {
        console.log("Error:", e)
    }
    //console.log(" [x] Sent %s: '%s'", topic, data);
}

function publish(topic, data) {

    if (!channelPublish)
        return;
    try {
        channelPublish.publish(channelPublish_exchangeTopic, topic.join('.'), Buffer.from(JSON.stringify(data)));
    }
    catch (e) {
        console.log("Error:", e)
    }
}
function publishDevice(deviceIdentity, type, data) {

    if (!channelPublish)
        return;

    let topic = ["device", deviceIdentity.id_local, deviceIdentity.uuid, deviceIdentity.vendor, deviceIdentity.model, deviceIdentity.serial, type]
    publish(topic, data);
}

// Settings
function setPublishChannelTopic(name) {
    channelPublish_exchangeTopic = name;
}
function setSubscribeChannelTopic(name, routingKey) {
    channelSubscribe_exchangeTopic = name;
    if (typeof routingKey !== "undefined")
        routingKeySubscribe = routingKey;
}


function setQueueSimpleSend(name) {
    channelQueueSimpleSendName = name;
}

function setQueueSimpleReceive(name) {
    channelQueueSimpleReceiveName = name;
}

function setQueueRpcServer(name, callback) {
    channelRpcServerName = name;
    rpcPromises = callback;
}

function setQueueRpcClient(name) {
    channelRpcClientName = name;
}


// Functions
module.exports.connect = connect;
module.exports.disconnect = disconnect;
module.exports.createChannelPublish = createChannelPublish;
module.exports.publishDevice = publishDevice;
module.exports.publish = publish;
module.exports.setPublishChannelTopic = setPublishChannelTopic;
module.exports.setSubscribeChannelTopic = setSubscribeChannelTopic;
module.exports.setQueueSimpleSend = setQueueSimpleSend;
module.exports.setQueueSimpleReceive = setQueueSimpleReceive;
module.exports.send2queue = send2queue;
module.exports.setQueueRpcServer = setQueueRpcServer;
module.exports.setQueueRpcClient = setQueueRpcClient;
// module.exports.send2queueRpc = send2queueRpc;
module.exports.rpcPromises = rpcPromises;
module.exports.sendRpc = sendRpc;



// Objects
module.exports.amqpEmitter = amqpEmitter;
// Settings

