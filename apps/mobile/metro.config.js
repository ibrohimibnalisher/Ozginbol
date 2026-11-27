// Expo SDK 52+ configures npm-workspace monorepos automatically.
const { getDefaultConfig } = require("expo/metro-config");

module.exports = getDefaultConfig(__dirname);
