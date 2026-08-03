module.exports = function (api) {
  api.cache(true);
  return {
    presets: ["babel-preset-expo"],
    // Must be listed last. Required for Reanimated 4 / worklets on Hermes.
    plugins: ["react-native-reanimated/plugin"],
  };
};
