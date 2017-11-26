import Raven from 'raven-js'
import React from 'react'
import { render } from 'react-dom'
import { AppContainer } from 'react-hot-loader'
import { Provider } from 'react-redux'

import App from './components/App.jsx'

import store from './store/store.js'

import './grid.scss'

Raven.config('https://3b11e5eed068478390e1e8f01e2190a9@sentry.io/250295').install()

const rootElement = document.getElementById('root')
if (rootElement == null) {
  throw new Error('could not find root element')
}

render(
  <AppContainer>
    <Provider store={ store }>
      <App />
    </Provider>
  </AppContainer>,
  rootElement
)

if (module.hot) {
  module.hot.accept('./components/App', () => {
    const NextApp = require('./components/App').default
    render(
      <AppContainer>
        <Provider store={ store }>
          <NextApp/>
        </Provider>
      </AppContainer>,
      rootElement
    )
  })
}
