import http from 'k6/http'

export const options = {
    insecureSkipTLSVerify: true,
    noConnectionReuse: true,
    vus: 1,
    duration: '10s',
}

export default () => {
    http.get('http://localhost:5001/api/utils/grades')
}
