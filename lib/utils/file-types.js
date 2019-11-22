const fileTypes = {
  image: 'ico,bmp,gif,png,jpg,jpeg,jpe,tif,tiff,thm'.split(','),
  binImage: 'psd,xcf'.split(','),
  rawImage: 'mrw,crw,cr2,cr3,dng,rw2'.split(','),
  video: 'avi,wmv,mov,mpg,mpeg,mp4,m4v,3gp,mjpeg,mts,flv,swf'.split(','),
  sound: 'wav,mp3,ogg,flac,m4a,aac,wma'.split(','),
  gps: 'gpx,kmz'.split(','),
  text: 'txt,conf,md,yml,html,sh,json,ts,js,csv,xml,ini,svg,m3u,xmp'.split(','),
  document: 'txt,doc,docx,md,log,ai,pdf'.split(','),
  archive: 'zip,tar,gz,bzip'.split(','),
  bin: 'exe,dll'.split(',')
}

module.exports = fileTypes;
