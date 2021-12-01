import http from 'k6/http'
import { sleep, check } from 'k6'
import createAndActivateClub from '/home/andrii/Addspire/addspire-server/tests/k6/utils/createAndActivateClub.js'

const VUsCount = 100

export let options = {
    stages: [
        { duration: '30s', target: VUsCount },
        // { duration: '10s', target: 200 },
        // { duration: '10s', target: 300 },
        // { duration: '10s', target: 400 },
        { duration: '10s', target: VUsCount },
        // { duration: '10s', target: 600 },
        // { duration: '10s', target: 700 },
        // { duration: '10s', target: 800 },
        // { duration: '10s', target: 900 },
        // { duration: '10s', target: 1000 },
        { duration: '10s', target: 0 },
    ],
    insecureSkipTLSVerify: true,
    noConnectionReuse: true,
}

export function setup() {
    return createAndActivateClub()
}

let httpReqParams = { headers: { accountId: `${__VU}` } }

export default function (data) {
    const { clubId } = data

    const url = 'http://localhost:5001/api/question/create'
    const payload = {
        clubId,
        name: 'How to drive a car?',
        description: 'I want to know how to o it.',
        images: ['test1.jpg', 'test2.jpg'],
        bonusCoins: 100,
        bookmark: true,
        tags: ['question1', 'question2', `question_${__VU}_${__ITER}`],
    }

    const newCrocResp = http.post(url, payload, httpReqParams)

    check(newCrocResp, {
        'Question created correctly': (r) => {
            if (r.status != 200) console.log(r.status)
            return r.status == 200
        },
    })
}
