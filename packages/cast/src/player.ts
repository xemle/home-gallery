import { Client, DefaultMediaReceiver } from 'castv2-client';

import Logger from '@home-gallery/logger'

const log = Logger('cast.player')

const startCast = async (host, cb) => {
  const client = new Client();

  client.connect(host, err => {
    if (err) {
      return cb(err)
    }

    client.launch(DefaultMediaReceiver, (err, player) => cb(err, player, client));
  });

  client.on('error', (err) => {
    log.error(err, `Client error: ${err}`);
    client.close();
  });
}

const startCastAsync = async (host) => {
  const t0 = Date.now()
  log.debug(`Starting player`)
  return new Promise((resolve, reject) => {
    startCast(host, (err, player, client) => {
      if (err) {
        log.error(err, `Could not start player: ${err}`)
        return reject(err)
      }
      log.debug(t0, `Player started`)
      resolve([player, client])
    })
  })
}

const createVideo = ({title, video, image}) => {
  return {
    contentId: video,
    contentType: 'video/mp4',
    streamType: 'BUFFERED',

    metadata: {
      type: 0,
      metadataType: 0,
      title: title,
      images: [{ url: image }]
    }
  }
}

const createImage = ({image}) => {
  return {
    contentId: image,
    contentType: 'image/jpg',
    streamType: 'BUFFERED',

    metadata: {
      type: 0,
      metadataType: 0,
    }
  }
}

const isVideo = url => url && url.match(/\.mp4$/)

const createMedia = entry => entry.type == 'video' ? createVideo(entry) : createImage(entry)

export const slideshow = async (host, entries, options = {}) => {
  const [player] = await startCastAsync(host)

  let i = 0
  let isLoading = false

  const delayNext = () => {
    setTimeout(() => {
      log.debug(`Continue with next media`)
      next()
    }, options.delay || 5000)
  }

  const next = () => {
    let index = i++ % entries.length
    if (options.random) {
      index = +Math.round(Math.random() * (entries.length - 1))
    }
    const entry = entries[index]
    const media = createMedia(entry)
    log.info(`Play ${index}: ${entries[index]}`)
    isLoading = true
    player.load(media, {autoplay: true}, (err, status) => {
      isLoading = false
      if (err) {
        return log.error(err, `Failed to load media entry ${entries[index]}`)
      }
      log.trace({status}, `Load returned status ${status.playerState}`)
      if (entry.type != 'video') {
        delayNext()
      }
    })
  }

  next()

  player.on('status', (status) => {
    log.trace({status}, `Received player state ${status.playerState}`)
    if (isLoading || status.playerState != 'IDLE') {
      return
    }
    if (!status.idleReason || status.idleReason == 'FINISHED') {
      log.debug(`Received idle status. Continue with next media`)
      next()
    }
  });
}
