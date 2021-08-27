import http from 'k6/http'
import { sleep, check } from 'k6'
import { Counter } from 'k6/metrics'
import createAndActivateClub from '/home/andrii/Addspire/addspire-server/tests/k6/utils/createAndActivateClub.js'

const VUsCount = 7

export let options = {
    stages: [
        { duration: '10s', target: VUsCount },
        { duration: '30s', target: VUsCount },
        { duration: '10s', target: 0 },
    ],
    insecureSkipTLSVerify: true,
    noConnectionReuse: true,
}
export function setup() {
    return createAndActivateClub()
}

let httpReqParams = { headers: { accountId: `f_` + __VU } } // token is set in init()

export default function (data) {
    const { clubId } = data
    const url = 'http://localhost:5001/api/club/invite'
    const payload = {
        clubId,
    }
    const newCrocResp = http.post(url, payload, httpReqParams)
    check(newCrocResp, {
        'Invite link generated': (r) => {
            if (r.status != 200) console.log(r.status)

            return r.status == 200
        },
    })
}
