import http from 'k6/http'
import { sleep, check } from 'k6'

const VUsCount = 1000

export let options = {
    stages: [
        { duration: '10s', target: VUsCount },
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

let httpReqParams = { headers: { accountId: `f_${__VU}` } } // token is set in init()

export default function () {
    const url = 'http://localhost:5001/api/club/create'
    const payload = {
        name: 'Rollers of US',
        description: 'For all of us',
        image: 'roller.jpeg',
        tags: ['club1', 'club2'],
    }

    const newCrocResp = http.post(url, payload, httpReqParams)

    check(newCrocResp, {
        'Club created correctly': (r) => {
            return r.status == 201
        },
    })
}
