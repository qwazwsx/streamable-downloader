import fs = require('fs')
import fetch from 'node-fetch'
import { EventEmitter } from 'events'

const CONCURRENT_DOWNLOADS_DEFAULT = 7
const DOWNLOAD_DIRECTORY_DEFAULT = './videos'
const BASE_API_URL = 'https://ajax.streamable.com/videos'

interface StreamableVideo {
  file_id: string
  title: string
  date_added: string
  ext: string
  files: { mp4: { url: string } }
}

interface StreamableResponse {
  total: number
  videos: StreamableVideo[]
}

class StreamableVideoDownloader {
  private readonly cookie: string
  private readonly eventBus: EventEmitter
  private readonly concurrentDownloads: number
  private readonly downloadDirectory: string

  constructor(
    cookie: string,
    {
      concurrentDownloads = CONCURRENT_DOWNLOADS_DEFAULT,
      downloadDirectory = DOWNLOAD_DIRECTORY_DEFAULT,
    } = {}
  ) {
    this.cookie = cookie
    this.concurrentDownloads = concurrentDownloads
    this.downloadDirectory = downloadDirectory
    this.eventBus = new EventEmitter()
  }

  private fetchTotal = async (): Promise<number> => {
    const response = await fetch(`${BASE_API_URL}?count=0`, {
      headers: { cookie: this.cookie },
    })
    const { total }: StreamableResponse = await response.json()
    return total
  }

  private getVideosFromPage = async (
    page: number
  ): Promise<StreamableVideo[]> => {
    const url = `${BASE_API_URL}?sort=date_added&sortd=DESC&count=100&page=${page}`
    const response = await fetch(url, { headers: { cookie: this.cookie } })
    const { videos }: StreamableResponse = await response.json()
    return videos
  }

  private async accumulateVideos(): Promise<StreamableVideo[]> {
    const pageVideos: StreamableVideo[][] = []
    let page = 1
    let done = false

    while (!done) {
      const videosOnPage = await this.getVideosFromPage(page)
      pageVideos.push(videosOnPage)
      page++
      done = videosOnPage.length === 0
    }

    return pageVideos.flat()
  }

  private async processQueue(videos: StreamableVideo[]) {
    this.eventBus.on('downloaded', () => {
      if (videos.length > 0) {
        this.processQueueItem(videos.shift()!)
      }
    })
    videos.splice(0, this.concurrentDownloads).forEach(this.processQueueItem)
  }

  private processQueueItem = async (video: StreamableVideo) => {
    const { body } = await fetch(`http:${video.files.mp4.url}`, {
      headers: { cookie: this.cookie },
    })

    // Process another queue item
    this.eventBus.emit('downloaded')

    // Save file.
    const filePath = `${this.downloadDirectory}/${
      video.date_added
    }-${video.title.replace(/[ !\/]/g, '_').trim()}-${video.file_id}.${
      video.ext
    }`
    console.info(`Saving file: ${filePath}`)
    // console.info(`with data`, data)
    const dest = fs.createWriteStream(filePath)
    body.pipe(dest)
  }

  async downloadAllVideos() {
    const totalVideos = await this.fetchTotal()
    const videos = await this.accumulateVideos()
    this.processQueue(videos)
  }
}

function createDownloadDirectory(dir: string) {
  if (fs.existsSync(dir)) {
    return
  }

  fs.mkdirSync(dir)
}

function usage() {
  console.info(`Usage: node index.js COOKIE

where COOKIE is the cookie string retrieved from streamable.com.`)
}

async function main() {
  var args = process.argv.slice(2)
  const cookie = args[0]
  let concurrentRequests = Number(args[1])

  if (Number.isNaN(concurrentRequests)) {
    concurrentRequests = CONCURRENT_DOWNLOADS_DEFAULT
  }

  if (cookie === undefined) {
    usage()
  }

  createDownloadDirectory(DOWNLOAD_DIRECTORY_DEFAULT)
  const dl = new StreamableVideoDownloader(cookie)
  dl.downloadAllVideos()
}

main()
