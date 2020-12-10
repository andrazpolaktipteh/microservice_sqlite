#!/usr/bin/env node

const AmqpConnection = require('./src/AmqpConnectFunction.js');


AmqpConnection.setQueueRpcClient("ms_sqlite_rpc");
AmqpConnection.connect('amqp://localhost');

const testData = {
    countInsideCorrection: 2,
    countInsideMax: 2,
    countInsideMaxDisplay: 2,
    countInsideLockDoor: 2,
    doorMode: "Open"
}


setInterval(sendData,1000);



function sendData(){
    testData.countInsideCorrection++;
    AmqpConnection.sendRpc({command: "write", table:"settings", data: testData})
    .then((data) => {

        console.log('Received confirm:', data);

    })
}