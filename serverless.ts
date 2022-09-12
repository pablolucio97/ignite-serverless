import type { AWS } from '@serverless/typescript';

const serverlessConfiguration: AWS = {
  service: 'ignite-serverless',
  frameworkVersion: '3',
  plugins: ['serverless-esbuild', 'serverless-dynamodb-local', 'serverless-offline'],
  //serverless-offline must be the last one plugin
  provider: {
    name: 'aws',
    runtime: 'nodejs14.x',
    region: "us-east-1", //more cheap with higher latency
    apiGateway: {
      minimumCompressionSize: 1024,
      shouldStartNameWithService: true,
    },
    environment: {
      AWS_NODEJS_CONNECTION_REUSE_ENABLED: '1',
      NODE_OPTIONS: '--enable-source-maps --stack-trace-limit=1000',
    },
    lambdaHashingVersion: '20201221',
    iamRoleStatements: [
      {
        Effect: "Allow",
        Action: ["dynamodb:*"],
        Resource: ["*"]
      },
      {
        Effect: "Allow",
        Action: ["s3:*"],
        Resource: ["*"]
      }
    ]
  },
  // import the function via paths
  functions: {
    generateCertificate: {
      handler: 'src/functions/generateCertificate.handler', //function path
      events: [
        {
          http: {
            path: 'generateCertificate',
            method: 'post',
            cors: true,
          }
        }
      ]
    },
    verifyCertificate: {
      handler: 'src/functions/verifyCertificate.handler', //function path
      events: [
        {
          http: {
            path: 'verifyCertificate/{id}',
            method: 'get',
            cors: true,
          }
        }
      ]
    }
  },
  package: { individually: false, include: ["./src/templates/**"] },
  custom: {
    esbuild: {
      bundle: true,
      minify: false,
      sourcemap: true,
      exclude: ['aws-sdk'],
      target: 'node14',
      define: { 'require.resolve': undefined },
      platform: 'node',
      concurrency: 10,
      external: ["chrome-aws-lambda"]
    },
    dynamodb: {
      stages: ['dev', 'local'],
      start: {
        port: 8000,// default dynamodb port,
        inMemory: true,
        migrate: true,
      }
    }
  },
  resources: {
    Resources: {
      dbCertificatesUsers: { // name of your resource
        Type: "AWS::DynamoDB::Table", // create an AWS DynamoDB table
        Properties: {
          TableName: "users_certificates",
          ProvisionedThroughput: { // how much operations/second is allowed
            ReadCapacityUnits: 5,
            WriteCapacityUnits: 5
          },
          AttributeDefinitions: [ //only the ID is enough because it's nosql
            {
              AttributeName: "id",
              AttributeType: "S", // string
            }
          ],
          KeySchema: [
            {
              AttributeName: "id",
              KeyType: "HASH",
            }
          ]
        }
      }
    }
  }
};

module.exports = serverlessConfiguration;
