import {ipcRenderer, remote} from 'electron'
import {h, render, Component} from 'preact'

const setting = remote.require('./setting')

class DesignApp extends Component {
  constructor(props) {
    super(props)

    //this.state = sabaki.state
  }

  componentDidMount() {}

  // Render

  render(_, state) {
    console.log(_, state)
    state = {...state}

    return h('section', {})
  }
}

// Render

render(h(DesignApp), document.body)
