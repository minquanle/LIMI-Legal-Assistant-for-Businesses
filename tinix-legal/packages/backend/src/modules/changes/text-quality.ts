// Mechanical quality gate, not a determination of legal accuracy.
export function readableReviewText(value:unknown){
 if(typeof value!=='string')return false;
 const words=value.normalize('NFC').toLocaleLowerCase('vi').match(/[\p{L}\p{N}]+/gu)??[];
 return words.length>=3&&new Set(words).size>=3&&!/(.{2,8})\1{3,}/u.test(value);
}
