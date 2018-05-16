/*eslint no-console: 0*/

import should from 'should'
import collect from 'get-stream'
import express from 'express'
import getPort from 'get-port'
import fetch from '../../src/fetch'
import parse from '../../src/parse'

let port, app, server
const sample = [
  { a: 1, b: 2, c: 3 },
  { a: 4, b: 5, c: 6 },
  { a: 7, b: 8, c: 9 }
]

describe('fetch', () => {
  before(async () => {
    port = await getPort()
    app = express()
    app.get('/file.json', (req, res) => {
      res.json({ data: sample })
    })
    server = app.listen(port)
  })
  after((cb) => server.close(cb))
  it('should throw in invalid options', async () => {
    should.throws(() => fetch(null))
    should.throws(() => fetch(1))
    should.throws(() => fetch({ url: 1 }))
    should.throws(() => fetch({ url: '', parser: () => {} }))
    should.throws(() => fetch({ url: '', parser: '' }))
  })
  it('should work with valid options', async () => {
    fetch({ url: 'http://google.com', parser: parse('json', { selector: '*' }) })
    fetch(() => {})
  })
  it('should request a flat json file', async () => {
    const source = {
      url: `http://localhost:${port}/file.json`,
      parser: parse('json', { selector: 'data.*' })
    }
    const stream = fetch(source)
    const res = await collect.array(stream)
    res.should.eql([
      { a: 1, b: 2, c: 3, ___meta: { row: 0, url: source.url } },
      { a: 4, b: 5, c: 6, ___meta: { row: 1, url: source.url } },
      { a: 7, b: 8, c: 9, ___meta: { row: 2, url: source.url } }
    ])
  })
  it('should emit http errors', (done) => {
    const stream = fetch({
      url: 'http://nothing:1234/file.json',
      parser: parse('json', { selector: 'data.*' })
    })
    stream.once('error', (err) => {
      should.exist(err)
      done()
    })
  })
})
