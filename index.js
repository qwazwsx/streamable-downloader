// Streamable Batch Downloader
// batch downloads all videos on a given streamable account
// usage: streamable-downloader <cookies> <concurrent requests>
//    cookies: string that contains browser cookies
//    concurrent requests: number of concurrent downloads to allow (default 5)

'use strict'
const fs = require('fs')
const request = require('request') // makes HTTP requests
// var progress = require('request-progress')
const Queue = require('async/queue') // queues up downloads
const fetch = require('isomorphic-fetch')
var args = process.argv.slice(2)
const cookie = args[0]

const CONCURRENT_DOWNLOADS_DEFAULT = 7
const DOWNLOAD_DIRECTORY = './videos'
const BASE_API_URL = 'https://ajax.streamable.com/videos'

if (cookie === undefined) {
  throw Error(
    'NO COOKIES FOUND. Pass in streamable cookies as a string to authenticate the request'
  )
}

// set concurrent requests to default if its unset
let concurrentRequests = args[1] || CONCURRENT_DOWNLOADS_DEFAULT

// make sure concurrent requests isnt NaN
if (isNaN(concurrentRequests)) {
  console.warn(
    `[WARNING] concurrent requests argument is NaN, resetting to default (${CONCURRENT_DOWNLOADS_DEFAULT})`
  )
  concurrentRequests = CONCURRENT_DOWNLOADS_DEFAULT
}

async function fetchTotal() {
  const response = await fetch(`${BASE_API_URL}?count=0`, {
    headers: { cookie },
  })
  const { total } = await response.json()
  return total
}

async function queueVideosFromPage(page, queue) {
  const url = `${BASE_API_URL}?sort=date_added&sortd=DESC&count=100&page=${page}`
  try {
    const res = await fetch(url, { headers: { cookie } })
    const { videos } = await res.json()

    videos.forEach(video => {
      queue.push({ video }, err => {
        if (err) throw err
      })
    })

    return videos.length
  } catch (err) {
    throw err
  }
}

function createDownloadDirectory(dir) {
  if (fs.existsSync(dir)) {
    return
  }

  fs.mkdirSync(dir)
}

async function downloadVideos() {
  // create a queue worker
  const totalVideos = await fetchTotal()
  let videosDownloaded = 0
  const queue = Queue(({ video }, callback) => {
    var file = Object.keys(video.files)[0]
    const url = `http:${video.files[file].url}`

    request(url)
      .on('error', err => {
        if (err) throw err
      })
      .on('end', () => {
        // Do something after request finishes
        videosDownloaded++
        console.log(
          `[${videosDownloaded} of ${totalVideos}][${video.file_id}] '${video.title}'`
        )
        callback()
      })
      // save file
      .pipe(
        fs.createWriteStream(
          'videos/' +
            `${video.date_added}-${video.title}-${video.file_id}.${video.ext}`.replace(
              /[ !\/]/g,
              '_'
            )
        )
      )
  }, concurrentRequests)

  createDownloadDirectory(DOWNLOAD_DIRECTORY)

  let page = 1
  let done = false
  while (!done) {
    const videosOnPage = await queueVideosFromPage(page, queue)
    done = videosOnPage === 0
    page++
  }
}

downloadVideos()
