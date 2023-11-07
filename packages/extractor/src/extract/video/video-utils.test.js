const t = require('tap')

const { getVideoStream, isPortraitVideo, fixRotatedScale, getFfmpegArgs, getVideoOptions } = require('./video-utils')

t.test('getVideoStream', async t => {
  t.test('success', async t => {
    const entry = {
      meta: {
        ffprobe: {
          streams: [
            {
              codec_type: 'video'
            }
          ]
        }
      }
    }
    const video = getVideoStream(entry)
    t.match(video?.codec_type, 'video')
  })

  t.test('no video', async t => {
    const entry = {
      meta: {
        ffprobe: {
          streams: [
            {
              codec_type: 'audio'
            }
          ]
        }
      }
    }
    const video = getVideoStream(entry)
    t.match(video, null)
  })
})

t.test('isPortraitVideo', async t => {
  t.test('undefined video', async t => {
    t.match(isPortraitVideo(), false)
  })

  t.test('missing side data', async t => {
    const video = {}

    t.match(isPortraitVideo(video), false)
  })

  t.test('ccw', async t => {
    const video = {
      side_data_list: [
        {
          side_data_type: 'Display Matrix',
          rotation: -90
        }
      ]
    }

    t.match(isPortraitVideo(video), true)
  })

  t.test('cw', async t => {
    const video = {
      side_data_list: [
        {
          side_data_type: 'Display Matrix',
          rotation: 90
        }
      ]
    }

    t.match(isPortraitVideo(video), true)
  })

})

t.test('fixRotatedScale', async t => {
  t.test('rotated', async t => {
    const args = [
      '-vf scale=-2:\'min(720,ih)\',format=yuv420p'
    ]
    t.match(args.map(fixRotatedScale(true)), ['-vf scale=\'min(720,iw)\':-2,format=yuv420p'])
  })

  t.test('not rotated', async t => {
    const args = [
      '-vf scale=-2:\'min(720,ih)\',format=yuv420p'
    ]
    t.match(args.map(fixRotatedScale(false)), ['-vf scale=-2:\'min(720,ih)\',format=yuv420p'])
  })

  t.test('scaled last', async t => {
    const args = [
      '-vf format=yuv420p,scale=0:\'min(720,ih)\',format=yuv420p'
    ]
    t.match(args.map(fixRotatedScale(true)), ['-vf format=yuv420p,scale=\'min(720,iw)\':0,format=yuv420p'])
  })

  t.test('rotated max', async t => {
    const args = [
      'scale=-2:\'max(720,ih*.5)\',format=yuv420p'
    ]
    t.match(args.map(fixRotatedScale(true)), ['scale=\'max(720,iw*.5)\':-2,format=yuv420p'])
  })

  t.test('rotated width', async t => {
    const args = [
      '-vf scale=\'min(720,iw/2)\':-2,format=yuv420p'
    ]
    t.match(args.map(fixRotatedScale(true)), ['-vf scale=-2:\'min(720,ih/2)\',format=yuv420p'])
  })

  t.test('replace all iw', async t => {
    const args = [
      '-vf scale=\'min(max(720,iw*.5),iw)\':-2,format=yuv420p'
    ]
    t.match(args.map(fixRotatedScale(true)), ['-vf scale=-2:\'min(max(720,ih*.5),ih)\',format=yuv420p'])
  })

  t.test('swap dimensions', async t => {
    const args = [
      '-vf scale=-2:iw/ih,format=yuv420p'
    ]
    t.match(args.map(fixRotatedScale(true)), ['-vf scale=ih/iw:-2,format=yuv420p'])
  })

  t.test('swap long dimensions', async t => {
    const args = [
      '-vf scale=-2:in_w/in_h,format=yuv420p'
    ]
    t.match(args.map(fixRotatedScale(true)), ['-vf scale=in_h/in_w:-2,format=yuv420p'])
  })

})

t.test('getFfmpegArgs', async t => {
  const roatedEntry = {
    meta: {
      ffprobe: {
        streams: [
          {
            codec_type: 'video',
            side_data_list: [
              {
                side_data_type: 'Display Matrix',
                rotation: -90
              }
            ]
          }
        ]
      }
    }
  }

  t.test('basic', async t => {
    const args = getFfmpegArgs({}, {})
    t.match(args, [
      '-c:v libx264',
      '-c:a aac',
      '-r 30',
      '-vf scale=-2:\'min(720,ih)\',format=yuv420p',
      '-preset slow',
      '-tune film',
      '-profile:v baseline',
      '-level:v 3.0',
      '-maxrate 4000k',
      '-bufsize 8000k',
      '-movflags +faststart',
      '-b:a 128k',
      '-f mp4',
      ]
    )
  })

  t.test('rotated video', async t => {
    const args = getFfmpegArgs(roatedEntry, {})
    t.match(args, [
      '-c:v libx264',
      '-c:a aac',
      '-r 30',
      '-vf scale=\'min(720,iw)\':-2,format=yuv420p',
      '-preset slow',
      '-tune film',
      '-profile:v baseline',
      '-level:v 3.0',
      '-maxrate 4000k',
      '-bufsize 8000k',
      '-movflags +faststart',
      '-b:a 128k',
      '-f mp4',
      ]
    )
  })

  t.test('video preview size', async t => {
    const args = getFfmpegArgs({}, {previewSize: 1920})
    t.match(args, [
      '-c:v libx264',
      '-c:a aac',
      '-r 30',
      '-vf scale=-2:\'min(1920,ih)\',format=yuv420p',
      '-preset slow',
      '-tune film',
      '-profile:v baseline',
      '-level:v 3.0',
      '-maxrate 4000k',
      '-bufsize 8000k',
      '-movflags +faststart',
      '-b:a 128k',
      '-f mp4',
      ]
    )
  })

  t.test('video scale', async t => {
    const args = getFfmpegArgs(roatedEntry, {previewSize: 500, scale: '-2:\'min(ih,max(720,min(1080,ih*.5)))\''})
    t.match(args, [
      '-c:v libx264',
      '-c:a aac',
      '-r 30',
      '-vf scale=\'min(iw,max(720,min(1080,iw*.5)))\':-2,format=yuv420p',
      '-preset slow',
      '-tune film',
      '-profile:v baseline',
      '-level:v 3.0',
      '-maxrate 4000k',
      '-bufsize 8000k',
      '-movflags +faststart',
      '-b:a 128k',
      '-f mp4',
      ]
    )
  })

  t.test('custom video ext', async t => {
    const args = getFfmpegArgs({}, {ext: 'mov'})
    t.match(args, [
      '-c:v libx264',
      '-c:a aac',
      '-r 30',
      '-vf scale=-2:\'min(720,ih)\',format=yuv420p',
      '-preset slow',
      '-tune film',
      '-profile:v baseline',
      '-level:v 3.0',
      '-maxrate 4000k',
      '-bufsize 8000k',
      '-movflags +faststart',
      '-b:a 128k',
      '-f mov',
      ]
    )
  })

  t.test('max video bit rate', async t => {
    const args = getFfmpegArgs({}, {maxVideoBitRate: 2000})
    t.match(args, [
      '-c:v libx264',
      '-c:a aac',
      '-r 30',
      '-vf scale=-2:\'min(720,ih)\',format=yuv420p',
      '-preset slow',
      '-tune film',
      '-profile:v baseline',
      '-level:v 3.0',
      '-maxrate 2000k',
      '-bufsize 4000k',
      '-movflags +faststart',
      '-b:a 128k',
      '-f mp4',
      ]
    )
  })

  t.test('frame rate', async t => {
    const args = getFfmpegArgs({}, {frameRate: 25})
    t.match(args, [
      '-c:v libx264',
      '-c:a aac',
      '-r 25',
      '-vf scale=-2:\'min(720,ih)\',format=yuv420p',
      '-preset slow',
      '-tune film',
      '-profile:v baseline',
      '-level:v 3.0',
      '-maxrate 4000k',
      '-bufsize 8000k',
      '-movflags +faststart',
      '-b:a 128k',
      '-f mp4',
      ]
    )
  })

  t.test('custom video encoder', async t => {
    const args = getFfmpegArgs({}, {videoEncoder: 'h264_qsv'})
    t.match(args, [
      '-c:v h264_qsv',
      ]
    )
  })

  t.test('custom h264 preset', async t => {
    const args = getFfmpegArgs({}, {preset: 'faster'})
    t.match(args.filter(arg => arg.match(/preset/)), [
      '-preset faster',
      ]
    )
  })

  t.test('custom h264 profile', async t => {
    const args = getFfmpegArgs({}, {profile: 'high'})
    t.match(args.filter(arg => arg.match(/profile/)), [
      '-profile:v high',
      ]
    )
  })

  t.test('custom h264 level', async t => {
    const args = getFfmpegArgs({}, {level: '4.2'})
    t.match(args.filter(arg => arg.match(/level/)), [
      '-level:v 4.2',
      ]
    )
  })

  t.test('custom ffmpeg args', async t => {
    const args = getFfmpegArgs({}, {customFfmpegArgs: ['-c:v', 'libx264']})
    t.match(args, [
      '-c:v',
      'libx264',
      '-f mp4'
      ]
    )
  })


  t.test('custom ffmpeg args with extension', async t => {
    const args = getFfmpegArgs({}, {ext: 'mov', customFfmpegArgs: ['-c:v', 'libx264']})
    t.match(args, [
      '-c:v',
      'libx264',
      '-f mov'
      ]
    )
  })

  t.test('custom ffmpeg args with rotated scale', async t => {
    const args = getFfmpegArgs(roatedEntry, {customFfmpegArgs: ['-c:v', 'libx264', '-vf', 'scale=-2:\'min(720,ih)\',format=yuv420p']})
    t.match(args, [
      '-c:v',
      'libx264',
      '-vf',
      'scale=\'min(720,iw)\':-2,format=yuv420p',
      '-f mp4'
      ]
    )
  })

  t.test('add ffmpeg args', async t => {
    const args = getFfmpegArgs({}, {addFfmpegArgs: ['-global_quality 25']})
    t.match(args, [
      '-c:v libx264',
      '-c:a aac',
      '-r 30',
      '-vf scale=-2:\'min(720,ih)\',format=yuv420p',
      '-preset slow',
      '-tune film',
      '-profile:v baseline',
      '-level:v 3.0',
      '-maxrate 4000k',
      '-bufsize 8000k',
      '-movflags +faststart',
      '-b:a 128k',
      '-global_quality 25',
      '-f mp4',
      ]
    )
  })

  t.test('custom ffmpeg args with add ffmpeg args', async t => {
    const args = getFfmpegArgs(roatedEntry, {customFfmpegArgs: ['-c:v', 'libx264'], addFfmpegArgs: ['-global_quality 25']})
    t.match(args, [
      '-c:v',
      'libx264',
      '-global_quality 25',
      '-f mp4'
      ]
    )
  })
})

t.test('getVideoOptions', async t => {
  t.test('emtpy', async t => {
    const extractor = {
      ffprobePath: './ffprobe',
      ffmpegPath: './ffmpeg'
    }
    t.match(getVideoOptions(extractor), {
      ffprobePath: './ffprobe',
      ffmpegPath: './ffmpeg',
      videoSuffix: 'video-preview-720.mp4',
    })
  })

  t.test('preview', async t => {
    const extractor = {
      ffprobePath: './ffprobe',
      ffmpegPath: './ffmpeg',
    }
    const config = {
      extractor: {
        video: {
          previewSize: 640,
          ext: 'mov'
        }
      }
    }

    t.match(getVideoOptions(extractor, config), {
      ffprobePath: './ffprobe',
      ffmpegPath: './ffmpeg',
      previewSize: 640,
      ext: 'mov',
      videoSuffix: 'video-preview-640.mov',
    })
  })

})