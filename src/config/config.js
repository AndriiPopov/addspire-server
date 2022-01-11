const dotenv = require('dotenv')
const path = require('path')
const Joi = require('joi')

dotenv.config({ path: path.join(__dirname, '../../../.env') })

const envVarsSchema = Joi.object()
    .keys({
        NODE_ENV: Joi.string()
            .valid('production', 'development', 'test')
            .required(),
        PORT: Joi.number().default(3000),
        MONGODB_URL: Joi.string().required().description('Mongo DB url'),
        JWT_SECRET: Joi.string().required().description('JWT secret key'),
        JWT_ACCESS_EXPIRATION_MINUTES: Joi.number()
            .default(30)
            .description('minutes after which access tokens expire'),
        JWT_REFRESH_EXPIRATION_DAYS: Joi.number()
            .default(30)
            .description('days after which refresh tokens expire'),
        JWT_INVITE_EXPIRATION_DAYS: Joi.number()
            .default(2)
            .description('days after which invite tokens expire'),
    })
    .unknown()

const { value: envVars, error } = envVarsSchema
    .prefs({ errors: { label: 'key' } })
    .validate(process.env)

if (error) {
    throw new Error(`Config validation error: ${error.message}`)
}

module.exports = {
    env: envVars.NODE_ENV,
    port: envVars.PORT,
    mongoose: {
        url:
            envVars.NODE_ENV === 'test'
                ? envVars.MONGODB_URL.replace(
                      'addspiredev?',
                      'addspiredev-test?'
                  )
                : envVars.MONGODB_URL,
        options: {
            useCreateIndex: true,
            useNewUrlParser: true,
            useUnifiedTopology: true,
            maxPoolSize: 200,
        },
    },
    jwt: {
        secret: envVars.JWT_SECRET,
        accessExpirationDays: envVars.JWT_ACCESS_EXPIRATION_DAYS,
        refreshExpirationDays: envVars.JWT_REFRESH_EXPIRATION_DAYS,
        inviteExpirationDays: envVars.JWT_INVITE_EXPIRATION_DAYS,
    },

    baseUrl:
        envVars.NODE_ENV === 'production'
            ? 'https://addspire.com/'
            : 'localhost:3000/',

    facebook: {
        id: envVars.FACEBOOK_ID,
        secret: envVars.FACEBOOK_SECRET,
    },
    google: {
        web: {
            id: envVars.GOOGLE_ID_WEB,
            secret: envVars.GOOGLE_SECRET_WEB,
        },
        ios: {
            id: envVars.GOOGLE_ID_IOS,
        },
        android: {
            id: envVars.GOOGLE_ID_ANDROID,
        },
    },
}
