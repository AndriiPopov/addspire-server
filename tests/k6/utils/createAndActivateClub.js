import http from 'k6/http'
import { sleep, check } from 'k6'
export default () => {
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

    newCrocResp = http.post(
        'http://localhost:5001/api/question/create',
        {
            clubId,
            name: 'How to drive a car?',
            description: 'I want to know how to o it.',
            images: ['test1.jpg', 'test2.jpg'],
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
