/* eslint-env browser */
/* eslint-env es6 */

function indent() {
  return 'Good';
}
console.log(indent());

function cognitivecomplexity() {
  const ans = 20;
  if (ans > 1 && ans > 2 && ans > 3 && ans > 4 && ans > 5 && ans > 6) {
    console.log(ans);
  }
  return ans;
}
console.log(cognitivecomplexity());

function nomultipleemptylines() {
  console.log('line 1');

  console.log('line 2');

  return 'Good';
}
console.log(nomultipleemptylines());

function maxlen() {
  return `Lorem ipsum dolor sit amet, consectetur adipiscing elit, 
          sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. 
          Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. 
          Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. 
          Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.`;
}
console.log(maxlen());

function noduplicatestring() {
  const lang = ['Java', 'PHP', 'Javascript', 'HTML', 'C', 'React'];
  const intro = 'I love to write programs';
  const a = intro + lang[0];
  const b = intro + lang[1];
  const c = intro + lang[2];
  const d = intro + lang[3];
  const e = intro + lang[4];
  const f = intro + lang[5];
  return [a, b, c, d, e, f];
}
console.log(noduplicatestring());

function noplusplus() {
  let ans = 1;
  ans += 1;
  return ans;
}
console.log(noplusplus());
