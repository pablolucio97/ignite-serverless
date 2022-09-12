import { APIGatewayProxyHandler } from 'aws-lambda'
import { document } from '../utils/dynamodbClient'

interface IUserCertificate {
    name: string
    id: string
    created_at: Date
    grade: number
}

export const handler: APIGatewayProxyHandler = async (event) => {

    const { id } = event.pathParameters

    const response = await document.query({
        TableName: 'users_certificates',
        KeyConditionExpression: "id = :id",
        ExpressionAttributeValues: {
            "id": { "S": id }
        }
    }, function (err, data) {
        if (err) {
            console.log("Error", err);
        } else {
            console.log("Success", data.Items);
        }
    }).promise()

    const userCertificate = response.Items[0] as unknown as IUserCertificate

    if (userCertificate) {
        return {
            statusCode: 201,
            body: JSON.stringify({
                message: 'Certificate generate with success.',
                name: userCertificate.name,
            })
        }
    }

    return {
        statusCode: 400,
        body: JSON.stringify({
            message: 'Invalid certificate.',
        })
    }
}