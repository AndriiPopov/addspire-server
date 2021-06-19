const mongoLength = {
    name: { max: 202, min: 1 },
    description: { max: 20002, min: 9 },
    message: { max: 1002, min: 9 },
    tag: { max: 72, min: 1 },
}

const JoiLength = {
    name: { max: 201, min: 2 },
    description: { max: 20001, min: 10 },
    message: { max: 1001, min: 10 },
    tag: { max: 71, min: 1 },
}

module.exports.mongoLength = mongoLength
module.exports.JoiLength = JoiLength
