import React from 'react'

import Footer from './Footer'
import Navbar from '../containers/Nav.jsx'
import SearchModal from './SearchModal'

export const ContainerBase = ({ children }) =>
  <div>
    <Navbar className="pl-3 pr-3" />
    { children }
    <SearchModal/>
    <Footer/>
  </div>

export const Container = ({ children }) =>
  <div className="pb-3 pt-0 container pl-3 pr-3">
    { children }
  </div>

export default Container
