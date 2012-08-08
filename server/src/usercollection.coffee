_ = require 'underscore'
User = require __dirname + '/user'
#
# Collection of User objects
#
class UserCollection

  constructor: ->
    @users = []

  # Adds a user object to the collection.
  # @throws duplicate-user exception if user already exists in the collection
  addUser: (user) ->
    exists = @.getUser user.username
    throw { error: 'duplicate-user', message: 'Username is already in use.' } if exists
    @users.push user

  # When authentication is unneccessary, adds an anonymous user to the collection
  addAnonymousUser: (sessionId) ->
    username = 'Client #' + ('00000' + Math.round(Math.random() * 1000, 0)).slice(-5)
    user = new User(username)
    user.setSessionId sessionId
    try
      @.addUser user
    catch e

  removeUser: (user) ->
    users = @users
    _.each @users, (collectionUser, key) ->
      delete users[key] if collectionUser.username is user.username

  # Restores a user to the collection based on session data
  restoreUser: (session) ->
    if not session.username?
      return false
    user = @.getUser session.username
    if not user?
      user = new User session.username
      user.setSessionId session.sessionId
    user.setClientId null
    try
      @.addUser user
    catch e
      #do nothing
    user

  getUser: (username) ->
    _.find @users, (collectionUser) ->
      collectionUser.username is username

  getSessionUser: (sessionId) ->
    _.find @users, (collectionUser) ->
      collectionUser.sessionId is sessionId

  getClientUser: (clientId) ->
    _.find @users, (collectionUser) ->
      collectionUser.clientId is clientId

  toString: ->
    usernames = []
    _.each @users, (collectionUser) ->
      usernames.push collectionUser.username
    usernames.toString()

module.exports = UserCollection