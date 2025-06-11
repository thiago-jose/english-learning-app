module.exports = {
  presets: ['module:metro-react-native-babel-preset'],
  plugins: [
    'nativewind/babel',
    "@babel/plugin-transform-class-properties",
    "@babel/plugin-transform-optional-chaining",
    "@babel/plugin-transform-nullish-coalescing-operator",
    "@babel/plugin-transform-numeric-separator",
    "@babel/plugin-transform-optional-catch-binding",
    "@babel/plugin-transform-async-generator-functions",
    "@babel/plugin-transform-object-rest-spread"
  ],
}; 