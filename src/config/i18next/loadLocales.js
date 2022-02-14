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
            // get current verions and available language packs
            const versions = JSON.parse(data)

            if (versions && Array.isArray(versions)) {
                // eslint-disable-next-line no-restricted-syntax
                for (const element of versions) {
                    if (element && Array.isArray(element)) {
                        const [name, version, title] = element
                        //get current version in redis
                        const savedVersion = await get(`${name}_${side}_v`)
                        let savedLocale = await get(`${name}_${side}_l`)
                        if (savedVersion !== version || !savedLocale) {
                            // if version is different load and save to redis
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
                        } else if (savedLocale) {
                            //if versions are the same, load to backend and add to available locales
                            availableLocales.push({ name, title })
                            if (side === 'backend') {
                                i18next.addResourceBundle(
                                    name,
                                    'translation',
                                    JSON.parse(savedLocale),
                                    false,
                                    false
                                )
                            }
                        }
                    }
                }
                //load  all languages and save available languages to redis
                i18next.loadLanguages(availableLocales.map((i) => i.name))
                client.set(
                    `availableLocales_${side}`,
                    JSON.stringify(availableLocales)
                )
            }
        }
    )
}

//Load default english language pack for backend
fs.readFile(
    path.resolve(
        __dirname,
        `../../../../addspire-locales/locales/backend/en.json`
    ),
    async (err, locale) => {
        let translations = locale
        if (err) {
            translations = en
            console.log(err)
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
            // Load other language packs for backend and frontend and schedule checking for updates every day.
            () => {
                loadLocales('frontend')
                loadLocales('backend')
                schedule.scheduleJob('0 * * * *', () => loadLocales('frontend'))
                schedule.scheduleJob('1 * * * *', () => loadLocales('backend'))
            }
        )
    }
)
