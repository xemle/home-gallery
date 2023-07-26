const t = require('tap')

const { getVideoStream, isVideoRotated, fixRotatedScale } = require('./video-utils')

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

t.test('isVideoRotated', async t => {
  t.test('undefined video', async t => {
    t.match(isVideoRotated(), false)
  })

  t.test('missing side data', async t => {
    const video = {}
    
    t.match(isVideoRotated(video), false)
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
    
    t.match(isVideoRotated(video), true)
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
    
    t.match(isVideoRotated(video), true)
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

})