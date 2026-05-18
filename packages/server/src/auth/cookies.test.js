import t from 'tap'
import {clearSessionCookie, getSessionCookie, setSessionCookie} from './cookies.js'

t.test('Set session cookie', t => {
    const [calls, res] = mockResponse()

    setSessionCookie(res, 'abc123')

    t.same(calls, [[
        'Set-Cookie',
        'SESSIONID=abc123; HttpOnly; SameSite=Strict; Path=/; Max-Age=604800'
    ]])
    t.end()
})

t.test('Clear session cookie', t => {
    const [calls, res] = mockResponse()

    clearSessionCookie(res)

    t.same(calls, [[
        'Set-Cookie',
        `SESSIONID=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0`
    ]])
    t.end()
})

t.test('Get session cookie', t => {
    const req = {
        headers: {
            cookie: 'SESSIONID=98765; HttpOnly; SameSite=Strict; Path=/; Max-Age=604800'
        }
    }

    t.equal(getSessionCookie(req), '98765')
    t.end()
})

function mockResponse () {
    const calls = []
    const res = {
        setHeader: (...args) => {
            calls.push(args)
        }
    }
    return [calls, res];
}