import React from 'react'
import { connect } from 'react-redux'

import { roles } from './TeamInvite'

import {
  ButtonPrimary,
} from './Buttons'

import {
  creatingTeam
} from '../store/actions'

const mapStateToProps = (state, props) => ({
  loading: state.teams.creating
})

const mapDispatchToProps = dispatch => ({
  createTeam: (name, emails, level) => dispatch(creatingTeam(name, emails, level))
})

class TeamCreate extends React.Component {
  state = {
    level: 'contributor',
    emails: '',
    name: '',
  }

  handleInputChange = e => this.setState({ [e.target.name]: e.target.value })

  handleSubmit = async e => {
    e.preventDefault()
    const emails = this.state.emails.split(',').filter(x => x !== '')
    const { name, level } = this.state
    try {
      await this.props.createTeam(name, emails, level)
    } catch (e) {}
  }

  render () {
    return (
      <div>
        <h1 className="fs-9">Create Team</h1>
        <form action="" onSubmit={ this.handleSubmit }>
          <label className="d-flex align-center mb-3">Name
            <input
              value={ this.state.name }
              onChange={ this.handleInputChange }
              className="my-input ml-2"
              type="text"
              placeholder="A Great Team Name"
              name="name"/>
          </label>

          <div style={{ display: this.state.name === '' && 'none' }}>

            <h2 className="fs-6">Invite Team Members</h2>

            <input
              type="text"
              className="my-input mb-4"
              value={ this.state.emails }
              name='emails'
              onChange={ this.handleInputChange }
              placeholder="emails seperated by commas • j@example.com,hey@example.com"/>
            {
              roles.map(({ name, value, description }, id) =>
                <label key={ id } className="d-flex align-items-center pb-4">
                  <input
                    type="radio"
                    className="mr-2"
                    name="level"
                    checked={ this.state.level === value }
                    value={ value }
                    onChange={ this.handleInputChange }/>
                  <div>
                    <h4 className="fs-4 fw-500">{ name }</h4>
                    <p className="text-muted">{ description }</p>
                  </div>
                </label>
              )
            }
            <p className="mb-2">
              <b>Note:</b> Users without an account will be sent an email asking to create one.
            </p>
          </div>


          <ButtonPrimary
            type="submit"
            loading={ this.props.loading }
            className="justify-self-left">
            Create Team
          </ButtonPrimary>
        </form>
      </div>
    )
  }
}



const ConnectedTeamCreate = connect(
  mapStateToProps,
  mapDispatchToProps
)(TeamCreate)

export default ConnectedTeamCreate
