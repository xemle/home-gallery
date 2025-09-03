import crypto from 'crypto';

export const sha1Hex = (text) => {
  var digest = crypto.createHash('sha1');
  digest.update(text, 'utf8');
  return digest.digest('hex');        
}

