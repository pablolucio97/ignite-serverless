import { APIGatewayProxyHandler } from "aws-lambda"
import { document } from '../utils/dynamodbClient'
import { compile } from 'handlebars'
import dayjs from 'dayjs'
import { join } from 'path'
import { readFileSync } from 'fs'
import chromium from 'chrome-aws-lambda'
import { S3 } from 'aws-sdk'

interface ICreatedCertificate {
    id: string
    name: string
    grade: string
}

interface ITemplate {
    id: string
    name: string
    grade: string
    medal: string;
    date: string
}

const compileTemplate = async (data: ITemplate) => {
    // navigates untill the destiny from your repository root
    const filePath = join(process.cwd(), 'src', 'templates', 'certificate.hbs')
    const html = readFileSync(filePath, 'utf8')
    return compile(html)(data)
}



export const handler: APIGatewayProxyHandler = async (event) => {

    const { id, name, grade } = JSON.parse(event.body) as ICreatedCertificate



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

    const userAlreadyExists = response.Items[0]

    if (!userAlreadyExists) {
        await document.putItem({
            TableName: 'users_certificates',
            Item: {
                "id": { "S": id },
                "name": { "S": name },
                "grade": { "S": grade },
                "created_at": { "S": new Date().toTimeString() }
            }
        }
            , function (err, data) {
                if (err) {
                    console.log(err);
                } else {
                    console.log(data);
                }
            }
        ).promise()
    }

    const medalPath = join(process.cwd(), 'src', 'templates', 'selo.png.')
    const medal = readFileSync(medalPath, 'base64')

    const data: ITemplate = {
        id,
        name,
        grade,
        date: dayjs().format('DD/MM/YYYY'),
        medal
    }

    const content = await compileTemplate(data)

    const browser = await chromium.puppeteer.launch({
        args: chromium.args,
        defaultViewport: chromium.defaultViewport,
        executablePath: await chromium.executablePath,
    })

    const page = await browser.newPage()
    const pdf = await page.pdf({
        format: 'a4',
        landscape: true,
        printBackground: true, //applies same css background
        preferCSSPageSize: true, //applies the style from css hbs
        path: process.env.IS_OFFLINE ? "./certiicate.pdf" : null
    })
    page.setContent(content)

    await browser.close()

    const s3 = new S3()

    await s3.putObject({
        Bucket: 'certificates-ignite-pablo-silva',//same name from aws s3
        Key: `${id}.pdf`,
        ACL: 'public-read',
        Body: pdf,
        ContentType: 'application/pdf'
    }).promise()

    return {
        statusCode: 201,
        body: JSON.stringify(response.Items[0])
    }
}