const express = require('express')
const auth = require('../middleware/auth')
var AWS = require('aws-sdk')

const AWS_S3_KEY = process.env.AWSAccessKeyId
const AWS_S3_SECRET = process.env.AWSSecretKey
const AWS_S3_BUCKET = process.env.AWSBucket
const { getImgId } = require('../models/system')

const router = express.Router()

router.post('/', auth, async (req, res) => {
    try {
        var credentials = {
            accessKeyId: AWS_S3_KEY,
            secretAccessKey: AWS_S3_SECRET,
        }
        AWS.config.update({
            credentials: credentials,
            region: 'us-east-2',
        })
        var s3 = new AWS.S3()

        const imageName = 'users/img-' + (await getImgId())

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
                Key: imageName, //filename
                Expires: 100, //time to expire in seconds
                ACL: 'public-read',
            },
            (err, data) => {
                if (err) {
                    return res.end()
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
    } catch (ex) {
        console.log(ex)
        res.status(412).send('Failed')
    }
})

module.exports = router
