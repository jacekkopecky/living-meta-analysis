/* -------------------------------------------------------------------------- */
/*                                    Types                                   */
/* -------------------------------------------------------------------------- */

/**
 * @typedef {Object} Comment
 * @property {string} by
 * @property {string} onVersionBy
 * @property {string} text
 * @property {number} ctime
 * @property {boolean} hidden
 */

/**
 * @typedef {Object} Experiment
 * @property {string} title
 * @property {string} description
 * @property {string} enteredBy
 * @property {number} ctime
 * @property {Object.<string, ExperimentData[]>} data
 * @property {Comment[]} comments
 */

/**
 * @typedef {Object} ExperimentData
 * @property {string} value
 * @property {number} ctime
 * @property {string} enteredBy
 * @property {Comment[]} comments
 */

/**
 * @typedef {Object} Paper
 * @property {string} id
 * @property {string} title
 * @property {string} enteredBy
 * @property {number} ctime
 * @property {number} mtime
 * @property {string} reference
 * @property {string} description
 * @property {string} link
 * @property {string} doi
 * @property {string[]} tags
 * @property {string} modifiedBy
 * @property {Comment[]} comments
 * @property {string[]} columns
 * @property {Experiment[]} experiments
 */
