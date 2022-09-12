import { DynamoDB } from 'aws-sdk';

const options = {
    region: 'localhost',
    endpoint: 'http://localhost:8000', //default dynamodb port
    accessKeyId: 'x', // for allowing access to DynamoDB locally
    secretAccessKey: 'x' // for allowing access to DynamoDB locally
}

const isOffline = () => {
    return process.env.IS_OFFLINE 
    // var env created automatically by serverless-offline
}

export const document = isOffline ?
    new DynamoDB(options) : new DynamoDB()