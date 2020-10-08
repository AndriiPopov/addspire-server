const express = require('express')
const auth = require('../middleware/auth')
const aws = require('aws-sdk')

const AWS_S3_KEY = process.env.AWSAccessKeyId
const AWS_S3_SECRET = process.env.AWSSecretKey
const AWS_S3_BUCKET = process.env.AWSBucket
const Joi = require('@hapi/joi')
const getAccount = require('../utils/getAccount')
Joi.objectId = require('joi-objectid')(Joi)

const router = express.Router()

const signFileSchema = Joi.object({
    fileName: Joi.string().required(),
})

router.post('/', auth, async (req, res) => {
    try {
        // const { error } = signFileSchema.validate(req.body)
        // if (error) {
        //     return res.status(400).send('Image upload failed. Wrong data.')
        // }
        let account = await getAccount(req, res, 'currentId image __v', true)
        if (!account) return
        let fileName = req.body.fileName
        if (fileName === 'avatar') {
            account.image = account.image + 1
            account.save()
        }
        if (!fileName) {
            fileName = 'image' + account.currentId + '.jpeg'
            account.currentId = account.currentId + 1
            account.save()
        }
        console.log(AWS_S3_KEY)
        const s3 = new aws.S3({
            accessKeyId: AWS_S3_KEY,
            secretAccessKey: AWS_S3_SECRET,
            endpoint: 's3-us-east-2.amazonaws.com',
            signatureVersion: 'v4',
            region: 'us-east-2',
        })

        fileName = account._id.toString() + '/' + fileName

        const s3ParamsFile = {
            Bucket: AWS_S3_BUCKET,
            Key: fileName,
            Expires: 60,
            ContentType: 'image',
            ACL: 'public-read',
        }

        s3.getSignedUrl('putObject', s3ParamsFile, (err, data) => {
            if (err) {
                return res.end()
            }

            const returnDataFile = {
                signedRequest: data,
                url: `https://${AWS_S3_BUCKET}.s3.amazonaws.com/${fileName}`,
            }
            res.write(
                JSON.stringify({
                    ...returnDataFile,
                })
            )
            res.end()
        })
    } catch (ex) {
        console.log(ex)
        res.status(412).send('Failed')
    }
})

module.exports = router
