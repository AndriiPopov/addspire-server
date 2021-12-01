import http from 'k6/http'
import { sleep, check } from 'k6'
import { Counter } from 'k6/metrics'

const VUsCount = 100

let vuSetupsDone = new Counter('vu_setups_done')

export let options = {
    stages: [
        { duration: '10s', target: VUsCount },
        { duration: '30s', target: VUsCount },
        { duration: '10s', target: 0 },
    ],
    insecureSkipTLSVerify: true,
    noConnectionReuse: true,
}

let httpReqParams = { headers: { accountId: `${__VU}` } } // token is set in init()

let clubId = 'test'

export default function () {
    if (__ITER === 0) {
        let url = 'http://localhost:5001/api/club/create'
        let payload = {
            name: 'Rollers of US_' + __VU + '_' + __ITER,
            description: 'For all of us',
            image: 'roller.jpeg',
            tags: ['club1', 'club2'],
        }

        let newCrocResp = http.post(url, payload, httpReqParams)
        check(newCrocResp, {
            'Club created correctly': (r) => {
                return r.status == 201
            },
        })
        clubId = newCrocResp.json('redirect._id')
        if (check(clubId, { 'ClubId changed': () => clubId !== 'temp' })) {
        }
    } else {
        const url = 'http://localhost:5001/api/club/edit'
        const payload = {
            clubId,
            name: 'Rollers of US_' + __VU + '_' + __ITER,
            description: 'For all of us' + __VU + '_' + __ITER,
            image: 'roller.jpeg' + __VU + '_' + __ITER,
            tags: ['club4', 'club2', 'club2', 'club' + __VU + '_' + __ITER],
        }
        const newCrocResp = http.post(url, payload, httpReqParams)
        check(newCrocResp, {
            'Club edited correctly': (r) => {
                if (r.status != 201) console.log(r.status)
                return r.status == 201
            },
        })
    }
}
