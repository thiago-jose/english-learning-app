const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Add support for CSS files
config.resolver.sourceExts.push('css');

// Exclude the amplify directory and its contents from the web build
config.resolver.blockList = [/\/amplify\/.*/];

module.exports = config; 