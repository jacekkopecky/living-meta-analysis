/* eslint-env browser */
/* eslint-env es6 */

function indent() {
    return 'Bad';
}
console.log(indent());

function cognitivecomplexity() {
  const ans = 20;
  if (ans > 1) {
    console.log(ans);
    if (ans > 2) {
      console.log(ans);
      if (ans > 3) {
        console.log(ans);
        if (ans > 4) {
          console.log(ans);
          if (ans > 5) {
            console.log(ans);
            if (ans > 5) {
              console.log(ans);
            }
          }
        }
      }
    }
  }
  return ans;
}
console.log(cognitivecomplexity());

function noduplicatestring() {
  const lang = ['Java', 'PHP', 'Javascript', 'HTML', 'C', 'React'];
  const a = 'I love to write programs' + lang[0];
  const b = 'I love to write programs' + lang[1];
  const c = 'I love to write programs' + lang[2];
  const d = 'I love to write programs' + lang[3];
  const e = 'I love to write programs' + lang[4];
  const f = 'I love to write programs' + lang[5];
  return [a, b, c, d, e, f];
}
console.log(noduplicatestring());

function maxlen() {
  return 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.';
}
console.log(maxlen());

function nomultipleemptylines() {
  console.log('line 1');


  console.log('line 2');

  return 'Bad';
}
console.log(nomultipleemptylines());

function noplusplus() {
  let ans = 1;
  ans++;
  return ans;
}
console.log(noplusplus());