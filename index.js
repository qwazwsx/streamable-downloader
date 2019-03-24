// Streamable Batch Downloader
// batch downloads all videos on a given streamable account
// usage: streamable-downloader <cookies> <concurrent requests>
//    cookies: string that contains browser cookies
//    concurrent requests: number of concurrent downloads to allow (default 5)

'use strict'
const fs = require('fs')
const request = require('request') // makes HTTP requests
// var progress = require('request-progress')
const queue = require('async/queue') // queues up downloads
var args = process.argv.slice(2)
const options = { headers: { cookie: args[0] } } //
const concurrentDefault = 7
var downloaded = 0
var total

if (args[0] === undefined) {
  throw Error('NO COOKIES FOUND. Pass in streamable cookies as a string to authenticate the request')
}

// set concurrent requests to default if its unset
args[1] = args[1] === undefined ? concurrentDefault : args[1]

// make sure concurrent requests isnt NaN
if (isNaN(args[1])) {
  console.warn('[WARNING] concurrent requests argument is NaN, resetting to default (3)')
  args[1] = concurrentDefault
}

// yes, using the arbitrary number 99999999999999999999 as the limit is poor practice, but <INSERT EXCUSE>
request('https://ajax.streamable.com/videos?sort=date_added&sortd=DESC&count=99999999999999999999&page=1', options, (err, response, body) => {
  if (err) throw err
  body = JSON.parse(body)

  console.log('GET JSON succeeded - found ' + body.total + ' videos')
  total = body.total

  // loop over all videos
  for (let i = 0; i < body.videos.length; i++) {
    // push video to queue
    q.push({ video: body.videos[i] }, (err) => {
      if (err) throw err
    })
  }
})

// create a queue worker
var q = queue((task, callback) => {
  var file = Object.keys(task.video.files)[0]

  request('http:' + task.video.files[file].url).on('error', (err) => {
    if (err) throw err
  }).on('end', () => {
    // Do something after request finishes
    downloaded++
    console.log('[' + downloaded + '/' + total + '][' + task.video.file_id + '] \'' + task.video.title + '\'')
    callback()
  })
    // save file
    .pipe(fs.createWriteStream(task.video.file_id + '.' + task.video.ext))
}, args[1])
