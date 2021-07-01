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

module.exports = () => {
    createUser('0')
    createUser('1')
    createUser('2')
    createUser('3')
    createUser('4')
    createUser('5')
    createUser('6')
    createUser('7')
    createUser('8')
    createUser('9')
    createUser('10')
    createUser('11')
    createUser('12')
}
