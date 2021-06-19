const { userCreationService } = require('../src/services')

const createUser = async (id, name) => {
    await userCreationService.createUserFB(
        {
            id,
            displayName: name,
            email: 'andrii@gmail.com',
            picture: 'andrii.jpeg',
            photos: [{ value: 'andrii.jpeg' }],
        },
        () => {}
    )
}

module.exports = () => {
    createUser('0', 'Mike Tyson')
    createUser('1', 'Clevery Boy')
    createUser('2', 'Super Cute Girl')
    createUser('3', 'Older Woman')
    createUser('4', 'Grimpidy Lampidy Vary')
    createUser('5', 'Watsin Lihaoma')
    createUser('6', 'Владимир Владимирович Путин')
    createUser('7', 'Donald Trump')
    createUser('8', 'Joe Biden')
    createUser('9', 'Bondarenko Unitazy')
    createUser('10', 'Autoservice at Budahdy 14')
    createUser('11', 'Vicor Gugo')
    createUser('12', 'Lisa Maltisa')
}
