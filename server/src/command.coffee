_ = require 'underscore'

class Command

  events = {
    'command-request': [],
    'chat-request': [],
    'disconnect': []
  }

  help = [
    "\thelp - Display this help message\n"
  ]

  constructor: ->

  register: (event, callback) ->
    if _.has(events, event)
      events[event].push callback

  trigger: (event, message) ->
    if _.has(events, event)
      _.each(events[event], (func) ->
        func(message)
      )

  addHelpString: (str) ->
    help.push(str)

  helpToString: ->
    helpStr = ''
    helpStr += str for str in help
    helpStr

module.exports = Command