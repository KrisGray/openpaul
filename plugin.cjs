const pluginModule = require('./dist/index.cjs')
const plugin = pluginModule.default ?? pluginModule

module.exports = plugin
module.exports.default = plugin
