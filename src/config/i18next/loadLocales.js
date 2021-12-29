/* eslint-disable no-await-in-loop */
const schedule = require('node-schedule')
const fs = require('fs')
const path = require('path')
const i18next = require('i18next')
const { get, client } = require('../../services/redis.service')
const en = require('./en.json')

const loadLocales = (side) => {
    const availableLocales = []
    fs.readFile(
        path.resolve(
            __dirname,
            `../../../../addspire-locales/locales/${side}/index.json`
        ),
        async (err, data) => {
            if (err) {
                console.error(err)
                return
            }
            const versions = JSON.parse(data)
            if (versions && Array.isArray(versions)) {
                // eslint-disable-next-line no-restricted-syntax
                for (const element of versions) {
                    if (element && Array.isArray(element)) {
                        const [name, version, title] = element
                        const savedVersion = await get(`${name}_${side}_v`)
                        let savedLocale = await get(`${name}_${side}_l`)
                        if (savedVersion !== version && savedLocale) {
                            // eslint-disable-next-line security/detect-non-literal-fs-filename
                            fs.readFile(
                                path.resolve(
                                    __dirname,
                                    `../../../../addspire-locales/locales/${side}/${name}.json`
                                ),
                                async (err, locale) => {
                                    if (err) {
                                        console.error(err)
                                        return
                                    }
                                    client.set(`${name}_${side}_l`, locale)
                                    client.set(`${name}_${side}_v`, version)
                                    savedLocale = locale
                                    availableLocales.push({ name, title })
                                }
                            )
                        }
                        if (savedLocale) {
                            availableLocales.push({ name, title })
                            if (side === 'backend') {
                                i18next.addResourceBundle(
                                    name,
                                    'translation',
                                    JSON.parse(savedLocale),
                                    true,
                                    true
                                )
                            }
                        }
                    }
                }
                console.log(`availableLocales${side}`, availableLocales)
                i18next.loadLanguages(availableLocales.map((i) => i.name))
                client.set(
                    `availableLocales_${side}`,
                    JSON.stringify(availableLocales)
                )
            }
        }
    )
}

fs.readFile(
    path.resolve(
        __dirname,
        `../../../../addspire-locales/locales/backend/en.json`
    ),
    async (err, locale) => {
        let translations = locale
        if (err) {
            translations = en
        }
        i18next.init(
            {
                lng: 'en',
                fallbackLng: 'en',
                resources: {
                    en: {
                        translation: translations,
                    },
                },
            },
            () => {
                loadLocales('frontend')
                loadLocales('backend')
                schedule.scheduleJob('0 * * * *', () => loadLocales('frontend'))
                schedule.scheduleJob('1 * * * *', () => loadLocales('backend'))
            }
        )
    }
)
