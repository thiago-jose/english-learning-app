const createExpoWebpackConfigAsync = require('@expo/webpack-config');

module.exports = async function (env, argv) {
  const config = await createExpoWebpackConfigAsync(env, argv);

  // Exclude aws-cdk-lib and constructs from the web bundle
  config.externals = {
    'aws-cdk-lib': 'aws-cdk-lib',
    'constructs': 'constructs',
    // Add any other backend-specific modules that might be causing issues
  };

  return config;
}; 