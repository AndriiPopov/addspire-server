import http from 'k6/http'
import { sleep, check } from 'k6'
export default () => {
    const addResident = (id, clubId) => {
        const res = http.post(
            'http://localhost:5001/api/club/invite',
            { clubId },
            {
                headers: { accountId: `0` },
            }
        )

        check(res, {
            'Invite in setup created': (r) => {
                return r.status == 200
            },
        })

        const link = res.json('inviteLink')
        const queryData = link.split('=')
        const code = queryData[1]

        const res2 = http.post(
            'http://localhost:5001/api/club/accept-invite',
            { code },
            {
                headers: { accountId: `${id}` },
            }
        )
        check(res2, {
            'Invite accepted in setup': (r) => {
                return r.status == 200
            },
        })
    }
    let newCrocResp = http.post(
        'http://localhost:5001/api/club/create',
        {
            name: 'Rollers of US',
            description: 'For all of us',
            image: 'roller.jpeg',
            tags: ['club1', 'club2'],
        },
        {
            headers: { accountId: `0` },
        }
    )
    check(newCrocResp, {
        'Club created correctly': (r) => {
            return r.status == 201
        },
    })
    let clubId = newCrocResp.json('redirect._id')

    addResident(1, clubId)
    addResident(2, clubId)
    addResident(3, clubId)
    addResident(4, clubId)
    addResident(5, clubId)
    addResident(6, clubId)
    addResident(7, clubId)

    newCrocResp = http.post(
        'http://localhost:5001/api/question/create',
        {
            clubId,
            name: 'How to drive a car?',
            description: 'I want to know how to o it.',
            images: ['test1.jpg', 'test2.jpg'],
            bonusCoins: 100,
            bookmark: true,
            tags: ['adsasd', 'questionER'],
        },
        {
            headers: { accountId: `0` },
        }
    )
    check(newCrocResp, {
        'Question in setup created successfully': (r) => {
            return r.status == 200
        },
    })

    newCrocResp = http.post('http://localhost:5001/api/search/general', {
        clubId,
        type: 'question',
    })

    check(newCrocResp, {
        'Search question success in setup': (r) => {
            return r.status == 200
        },
    })

    const docs = newCrocResp.json('docs')

    let questionId = docs[0]._id

    return { clubId, questionId }
}
