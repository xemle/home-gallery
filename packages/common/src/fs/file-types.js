export const fileTypes = {
  image: 'ico,bmp,gif,png,jpg,jpeg,jpe,tif,tiff,thm,webp'.split(','),
  binImage: 'psd,xcf'.split(','),
  rawImage: 'arw,cr2,cr3,crw,dng,gpr,heic,heif,mrw,nef,nrw,orf,raf,rw2,sr2,srf,srw'.split(','),
  video: 'avi,wmv,mov,mpg,mpeg,mp4,m4v,3gp,mjpeg,mts,flv,swf,webm,mkv'.split(','),
  sound: 'wav,mp3,ogg,flac,m4a,aac,wma'.split(','),
  gps: 'gpx,kmz'.split(','),
  text: 'txt,conf,md,yml,html,sh,json,ts,js,csv,xml,ini,svg,m3u'.split(','),
  meta: 'xmp'.split(','),
  document: 'txt,doc,docx,md,log,ai,pdf'.split(','),
  archive: 'zip,tar,gz,bzip'.split(','),
  bin: 'exe,dll'.split(',')
}

export function getFileTypeByExtension(filename) {
  const match = filename.match(/\.(\w{2,4})$/);
  if (!match) {
    return 'unknown';
  }
  const ext = match[1].toLowerCase();
  const types = Object.keys(fileTypes);
  for (let i = 0; i < types.length; i++) {
    const type = types[i];
    const extensions = fileTypes[type];
    if (extensions.indexOf(ext) >= 0) {
      return type;
    }
  }
  return 'unknown';
}

