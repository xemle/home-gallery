import { exifPlugin } from './exiftool.js'
import { ffprobePlugin } from './ffprobe.js'
import { rawPreviewExifPlugin } from './raw-preview-exif.js'

import { toPlugin } from '../pluginUtils.js';

const plugin = toPlugin([exifPlugin, ffprobePlugin, rawPreviewExifPlugin], 'metaExtractor')

export default plugin