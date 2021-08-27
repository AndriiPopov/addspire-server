const faker = require('faker')
const { Account } = require('../src/models')
const { userCreationService } = require('../src/services')

const createUser = async (id) => {
    if (await Account.findOne({ facebookProfile: `f_${id}` })) return
    const ava = faker.image.avatar()
    await userCreationService.createUserFB(
        {
            id,
            displayName: faker.name.findName(),
            email: faker.internet.email(),
            picture: ava,
            photos: [{ value: ava }],
        },
        () => {}
    )
}

module.exports = (length) => {
    for (let i = 0; i <= length; i += 1) createUser(i.toString())
}
