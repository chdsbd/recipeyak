import * as React from "react"

import Footer from "@/components/Footer"
import Navbar from "@/containers/Nav"
import SearchModal from "@/components/SearchModal"

export const ContainerBase: React.SFC = ({ children }) => (
  <>
    <Navbar className="pl-3 pr-3" />
    {children}
    <SearchModal />
    <Footer />
  </>
)

export const Container: React.SFC = ({ children }) => (
  <div className="pb-3 pt-0 container pl-3 pr-3">{children}</div>
)

export default Container
