import http from 'k6/http'
import { sleep, check } from 'k6'
import createAndActivateClub from '/home/andrii/Addspire/addspire-server/tests/k6/utils/createAndActivateClub.js'

const VUsCount = 500

export let options = {
    stages: [
        { duration: '0s', target: VUsCount },
        // { duration: '10s', target: 200 },
        // { duration: '10s', target: 300 },
        // { duration: '10s', target: 400 },
        // { duration: '10s', target: VUsCount },
        // { duration: '10s', target: 600 },
        // { duration: '10s', target: 700 },
        // { duration: '10s', target: 800 },
        // { duration: '10s', target: 900 },
        // { duration: '10s', target: 1000 },
        { duration: '30s', target: VUsCount },
    ],
    insecureSkipTLSVerify: true,
    noConnectionReuse: true,
}

export function setup() {
    return createAndActivateClub()
}

let httpReqParams = { headers: { accountId: `${__VU}` } }

export default function (data) {
    const { clubId, questionId } = data

    const url = 'http://localhost:5001/api/comment/create'
    const payload = {
        text: 'This is a very nice article!',
        resourceId: questionId,
        resourceType: 'question',
        bookmark: true,
    }

    const newCrocResp = http.post(url, payload, httpReqParams)

    check(newCrocResp, {
        'Comments created correctly': (r) => {
            // if (r.status != 200) console.log(r.status)
            // if (r.status != 200) console.log(r.body)
            return r.status == 200
        },
    })
}
