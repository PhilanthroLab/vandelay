import request from 'superagent'
import { pickBy, omit } from 'lodash'
import userAgent from './userAgent'
import httpError from './httpError'

export const getToken = async (oauth) => {
  const rest = omit(oauth.grant, [ 'url', 'type' ])
  const res = await request
    .post(oauth.grant.url)
    .type('form')
    .accept('json')
    .send(pickBy({
      grant_type: oauth.grant.type,
      ...rest
    }, (v, k) => !!k && !!v))
    .set({
      'Cache-Control': 'no-cache',
      'User-Agent': userAgent
    })
    .retry(10)
    .timeout(30000)
    .catch((err) => {
      throw httpError(err, err.response && err.response.res)
    })

  return res.body.access_token
}
