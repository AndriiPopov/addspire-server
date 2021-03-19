const Joi = require('@hapi/joi')

const getResourcesFromList = require('../utils/getResourcesFromList')

// const validateSchema = Joi.object({
//     ids: Joi.array().items(Joi.string().optional()),
//     type: Joi.string().valid('user', 'website', 'resource'),
// }).unknown()

module.exports.requestResource = async (data, ws) => {
    try {
        // const { error } = validateSchema.validate(data)
        // if (error) return

        //Compare and send not found resources!!!!!!!!

        if (data.type && data.ids && data.ids.length > 0) {
            const [result, fields, onlineUsers] = await getResourcesFromList(
                data
            )

            if (result && result.length > 0) {
                for (let item of result) {
                    if (item)
                        ws.resources[data.type][item._id.toString()] = item.__v
                }

                ws.send(
                    JSON.stringify({
                        messageCode: 'addResource',
                        type: data.type,
                        resources: result.filter(item => item),
                        newOnlineUsers: onlineUsers,
                    })
                )
            } else {
                if (!fields) {
                    ws.send(
                        JSON.stringify({
                            messageCode: '404',
                        })
                    )
                }
                ws.send(
                    JSON.stringify({
                        messageCode: 'notFoundResource',
                        _id: data.ids,
                    })
                )
            }
        }
    } catch (ex) {
        console.log(ex)
    }
}
