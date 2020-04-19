import Immutable from 'immutable'

export const ShouldComponentUpdateMixin = {
  prevPropsMap: undefined,
  prevStateMap: undefined,

  getInitialState: function() {
    this.prevPropsMap = Immutable.Map()
    this.prevStateMap = Immutable.Map()
    return {}
  },

  shouldComponentUpdate: function(nextProps, nextState) {
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
}
