const nextConfig = require('eslint-config-next')

/** @type {import('eslint').Linter.Config[]} */
module.exports = [...nextConfig, { ignores: ['node_modules/', '.next/', 'out/', 'build/'] }]
