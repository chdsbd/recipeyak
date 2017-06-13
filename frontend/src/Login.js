import React from 'react'
import { Link } from 'react-router-dom'

const Login = () => (
  <div>
    <nav className="grid container">
      <h1 className="col-xs-2">
        <Link to="/" className="nav-item">Caena</Link>
      </h1>
    </nav>

    <main className="container form-container">
      <form>
        <ul className="tabs">
          <li className="active">
            <Link to="/login">Login</Link>
          </li>
          <li>
            <Link to="/signup">Signup</Link>
          </li>
        </ul>
        <label>Email
          <div className="input-text">
            <input className="input" type="email" name="email" placeholder="name@example.com"/>
          </div>
        </label>
        <label>Password
          <div className="input-text">
            <input className="input" type="password" name="password" />
          </div>
        </label>
        <input type="submit" className="button" value="submit" name=""/>
        <p>
          <Link to="/password-reset">Forgot password?</Link>
        </p>
      </form>

    </main>

  </div>
)

export default Login
