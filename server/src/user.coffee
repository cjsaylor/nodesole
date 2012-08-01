#
# User Object contains information about a user
#
class User
  constructor: (@username) ->

  setSessionId: (@sessionId) ->

  setClientId: (@clientId) ->

module.exports = User