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
    @.addUser user

  removeUser: (user) ->
    users = @users
    _.each @users, (collectionUser, key) ->
      delete users[key] if collectionUser.username is user.username

  getUser: (username) ->
    _.find @users, (collectionUser) ->
      return collectionUser.username is username

  getSessionUser: (sessionId) ->
    _.find @users, (collectionUser) ->
      return collectionUser.sessionId is sessionId

  getClientUser: (clientId) ->
    _.find @users, (collectionUser) ->
      return collectionUser.clientId is clientId

module.exports = UserCollection