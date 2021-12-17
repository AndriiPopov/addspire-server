const { default: i18next } = require('i18next')
const fs = require('fs')
const path = require('path')
const en = require('./en.json')

fs.readFile(
    path.resolve(__dirname, `../../addspire-locales/locales/backend/en.json`),
    async (err, locale) => {
        let translations = locale
        if (err) {
            translations = en
        }
        i18next.init({
            lng: 'en',
            fallbackLng: 'en',
            resources: {
                en: {
                    translation: JSON.parse(translations),
                },
            },
        })
    }
)
