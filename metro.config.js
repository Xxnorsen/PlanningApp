const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Allow Metro to bundle .webm animation files
config.resolver.assetExts.push('webm');

module.exports = config;
