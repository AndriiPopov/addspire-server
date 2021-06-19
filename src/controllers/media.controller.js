const AWS = require('aws-sdk')
const catchAsync = require('../utils/catchAsync')
const { System } = require('../models')

const AWS_S3_KEY = process.env.AWSAccessKeyId
const AWS_S3_SECRET = process.env.AWSSecretKey
const AWS_S3_BUCKET = process.env.AWSBucket

const signS3 = catchAsync(async (req, res) => {
    const credentials = {
        accessKeyId: AWS_S3_KEY,
        secretAccessKey: AWS_S3_SECRET,
    }
    AWS.config.update({
        credentials,
        region: 'us-east-2',
    })
    const s3 = new AWS.S3()

    const imageName = `users/img-${await System.getImgId()}`

    // const s3 = new aws.S3()

    // {
    //     accessKeyId: AWS_S3_KEY,
    //     secretAccessKey: AWS_S3_SECRET,
    //     endpoint: 's3-us-east-2.amazonaws.com',
    //     signatureVersion: 'v4',
    //     region: 'us-east-2',
    // }

    // const s3ParamsFile = {
    //     Bucket: AWS_S3_BUCKET,
    //     Key: imageName,
    //     Expires: 60,
    //     ContentType: 'image',
    // }
    s3.getSignedUrl(
        'putObject',
        {
            Bucket: AWS_S3_BUCKET,
            Key: imageName, // filename
            Expires: 100, // time to expire in seconds
            ACL: 'public-read',
        },
        (err, data) => {
            if (err) {
                res.end()
                return
            }

            const returnDataFile = {
                signedRequest: data,
                url: `https://${AWS_S3_BUCKET}.s3.amazonaws.com/${imageName}`,
            }
            res.write(
                JSON.stringify({
                    ...returnDataFile,
                })
            )

            res.end()
        }
    )
})

module.exports = {
    signS3,
}
