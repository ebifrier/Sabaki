import {h, Component} from 'preact'
import Immutable from 'immutable'

export function withShouldComponentUpdate(WrappedComponent) {
  return class extends Component {
    shouldComponentUpdate(nextProps, nextState) {
      let nextPropsMap = Immutable.Map(nextProps)
      let nextStateMap = Immutable.Map(nextState)

      if (
        !Immutable.is(nextPropsMap, this.prevPropsMap) ||
        !Immutable.is(nextStateMap, this.prevStateMap)
      ) {
        this.prevPropsMap = nextPropsMap
        this.prevStateMap = nextStateMap
        return true
      }

      return false
    }

    render() {
      return h(WrappedComponent, this.props)
    }
  }
}
