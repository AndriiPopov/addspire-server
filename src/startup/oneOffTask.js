module.exports = async () => {
    try {
        // const websites = await Website.find({})
        // if (!websites) {
        //     return
        // }
        // for (let website of websites) {
        //     const globalSettingsPage = await website.createGlobalSettingsResource(
        //         'page'
        //     )
        //     const globalSettingsTemplate = await website.createGlobalSettingsResource(
        //         'template'
        //     )
        //     if (!globalSettingsPage || !globalSettingsTemplate) return
        //     await website.save()
        // }
    } catch (ex) {
        console.log('Overall error in oneOff task')
        console.log(ex)
        return
    }
}
