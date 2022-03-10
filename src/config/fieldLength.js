// Field lengths for mongoDB
const mongoLength = {
    name: { max: 202, min: 1 },
    questionName: { max: 152, min: 19 },
    label: { max: 42, min: 4 },
    description: { max: 20002, min: 9 },
    message: { max: 1002, min: 1 },
    tag: { max: 72, min: 1 },
}

// Field lengths for Joi
const JoiLength = {
    name: { max: 201, min: 2 },
    questionName: { max: 151, min: 20 },
    label: { max: 41, min: 5 },
    description: { max: 20001, min: 10 },
    message: { max: 1001, min: 1 },
    tag: { max: 71, min: 1 },
}

module.exports.mongoLength = mongoLength
module.exports.JoiLength = JoiLength
