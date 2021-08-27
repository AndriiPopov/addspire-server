import http from 'k6/http'

export const options = {
    insecureSkipTLSVerify: true,
    noConnectionReuse: true,
    stages: [
        { duration: '30s', target: 100 },
        { duration: '30s', target: 100 },
        { duration: '30s', target: 200 },
        { duration: '30s', target: 200 },
        { duration: '30s', target: 300 },
        { duration: '30s', target: 300 },
        { duration: '30s', target: 400 },
        { duration: '30s', target: 400 },
        { duration: '30s', target: 0 },
    ],
}

export default () => {
    http.get('http://localhost:5001/api/utils/grades')
}
