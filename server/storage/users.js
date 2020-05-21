/* -------------------------------------------------------------------------- */
/*                                    Types                                   */
/* -------------------------------------------------------------------------- */

// ? Should the photo field be changed so that only a string is stored rather than an array of objects?

/**
  * @typedef {Object} User
  * @property {number} ctime
  * @property {number} mtime The user last 'registered' i.e. agreed to t&c's (may have changed username)
  * @property {string} email
  * @property {string} displayName
  * @property {string} username See regex for exact allowed names
  * @property {[{value: string}]} photos
  * @todo add favourites
*/
