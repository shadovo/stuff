/**
 * Encode a string to be HTML-safe.
 *
 * @section Encode HTML
 *
 * @example encodeHTML('<h1>Hello</h1>') // => '&lt;h1&gt;Hello&lt;/h1&gt;'
 */

function encodeHTML(str) {
  return str.replace(/[\u00A0-\u9999<>\&]/g, function (i) {
    return '&#' + i.charCodeAt(0) + ';';
  });
}

module.exports = encodeHTML;
