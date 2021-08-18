const { createClubTest } = require('../utils/requests')

module.exports = async (testData) => {
    testData.club0_Id = await createClubTest('0', {
        name: 'Flowers lovers',
        description: 'About flowers and gardens',
        image: 'flower.jpeg',
        tags: ['flowerTag0', 'flowerTag1', 'flowerTag2'],
    })

    testData.club1_Id = await createClubTest('5', {
        name: 'Animals lovers',
        description: 'About animals and pets',
        image: 'dog.jpeg',
        tags: ['animalTag0', 'animalTag1', 'animalTag2', 'flowerTag2'],
    })
}
