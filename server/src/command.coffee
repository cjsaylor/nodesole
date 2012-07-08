_ = require 'underscore'

class Command

  events = {
    'command-request': [],
    'disconnect': []
  }

  constructor: ->

  register: (event, callback) ->
    if _.has(events, event)
      events[event].push callback

  trigger: (event, message) ->
    if _.has(events, event)
      _.each(events[event], (func) ->
        func(message)
      )

module.exports = Command