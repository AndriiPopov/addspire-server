const { ImageData } = require('../models')

module.exports = (images, owner, club, question, oldImages) => {
    const newImages = []
    images.forEach((image) => {
        const oldImage = oldImages && oldImages.find((i) => i.url === image)
        if (oldImage) {
            newImages.push(oldImage)
        } else {
            const imageData = new ImageData({
                url: image,
                question,
                owner,
                club,
            })
            imageData.save()
            newImages.push({
                dataId: imageData._id,
                url: image,
            })
        }
    })
    return newImages
}
