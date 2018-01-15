// Grab white-listed environment variables and prepare them to be
// injected into the application via DefinePlugin in Webpack configuration.

const WHITELIST = [
  'NODE_ENV',
  'OAUTH_BITBUCKET_CLIENT_ID',
  'OAUTH_BITBUCKET_REDIRECT_URI',

  'OAUTH_FACEBOOK_CLIENT_ID',
  'OAUTH_FACEBOOK_REDIRECT_URI',

  'OAUTH_GITHUB_CLIENT_ID',
  'OAUTH_GITHUB_REDIRECT_URI',

  'OAUTH_GITLAB_CLIENT_ID',
  'OAUTH_GITLAB_REDIRECT_URI',

  'OAUTH_GOOGLE_CLIENT_ID',
  'OAUTH_GOOGLE_REDIRECT_URI',

  'FRONTEND_SENTRY_DSN',
]

function getClientEnvironment (publicUrl) {
  const raw = Object
    .keys(process.env)
    .filter(key => WHITELIST.includes(key.toUpperCase()))
    .reduce((env, key) => {
      env[key] = process.env[key]
      return env
    }, {
      // Useful for determining whether we’re running in production mode.
      // Most importantly, it switches React into the correct mode.
      'NODE_ENV': process.env.NODE_ENV || 'development',
      // Useful for resolving the correct path to static assets in `public`.
      // For example, <img src={process.env.PUBLIC_URL + '/img/logo.png'} />.
      // This should only be used as an escape hatch. Normally you would put
      // images into the `src` and `import` them in code to get their paths.
      'PUBLIC_URL': publicUrl
    })
  // Stringify all values so we can feed into Webpack DefinePlugin
  const stringified = {
    'process.env': Object
      .keys(raw)
      .reduce((env, key) => {
        env[key] = JSON.stringify(raw[key])
        return env
      }, {})
  }

  return { raw, stringified }
}

module.exports = getClientEnvironment
