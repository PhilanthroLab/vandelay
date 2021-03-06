import csvStream from 'csv-parser'
import excelStream from 'exceljs-transform-stream'
import through2 from 'through2'
import { from } from 'verrazzano'
import duplexify from 'duplexify'
import pumpify from 'pumpify'
import pump from 'pump'
import JSONStream from 'jsonstream-next'
import parseGTFS from 'gtfs-stream'
import { omit } from 'lodash'
import { parse as ndParse } from 'ndjson'
import unzip from './unzip'
import xml2json from './xml2json'

// these formatters receive one argument, "data source" object
// and return a stream that maps strings to items
export const csv = (opt) => {
  if (opt.zip) return unzip(csv.bind(this, { ...opt, zip: undefined }), /\.csv$/)

  const head = csvStream({
    mapHeaders: ({ header }) => header.trim()
  })
  // convert into normal objects
  const tail = through2.obj((row, _, cb) => {
    cb(null, omit(row, 'headers'))
  })
  return pumpify.obj(head, tail)
}
export const excel = (opt) => {
  if (opt.zip) return unzip(excel.bind(this, { ...opt, zip: undefined }), /\.xlsx$/)
  return excelStream({
    mapHeaders: (header) => header.trim()
  })
}

export const ndjson = (opt) => {
  if (opt.zip) return unzip(ndjson.bind(this, { ...opt, zip: undefined }), /\.ndjson$/)
  return ndParse()
}

export const json = (opt) => {
  if (Array.isArray(opt.selector)) {
    const inStream = through2()
    const outStream = through2.obj()
    opt.selector.forEach((selector) =>
      pump(inStream, json({ ...opt, selector }), outStream)
    )
    return duplexify.obj(inStream, outStream)
  }

  if (typeof opt.selector !== 'string') throw new Error('Missing selector for JSON parser!')
  if (opt.zip) return unzip(json.bind(this, { ...opt, zip: undefined }), /\.json$/)
  const head = JSONStream.parse(opt.selector)
  let header
  head.once('header', (data) => header = data)
  const tail = through2.obj((row, _, cb) => {
    if (header && typeof row === 'object') row.___header = header // internal attr, json header info for fetch stream
    cb(null, row)
  })
  return pumpify.obj(head, tail)
}

export const xml = (opt) => {
  if (opt.zip) return unzip(xml.bind(this, { ...opt, zip: undefined }), /\.xml$/)
  return pumpify.obj(xml2json(opt), json(opt))
}

export const html = (opt) => {
  if (opt.zip) return unzip(html.bind(this, { ...opt, zip: undefined }), /\.xml$/)
  return pumpify.obj(xml2json({ ...opt, strict: false }), json(opt))
}

export const gdb = (opts) => from.bind(null, 'gdb')(opts)
export const gpx = (opts) => from.bind(null, 'gpx')(opts)
export const kml = (opts) => from.bind(null, 'kml')(opts)
export const kmz = (opts) => from.bind(null, 'kmz')(opts)
export const shp = (opts) => from.bind(null, 'shp')(opts)

export const gtfsrt = () => parseGTFS.rt()
export const gtfs = () => parseGTFS.enhanced()
