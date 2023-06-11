/**
 * Log a console message with standard formatting.
 *
 * @param {string} message The message to log.
 * @param {string} [level] One of `log`, `info`, `warn` or `error`.  Defaults to `log`.
 */
function log(message, level = "log") {
  console[level](`${new Date().toLocaleString()} - ${message}`);
}

module.exports = log;
