_ = require 'underscore'
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

  removeUser: (user) ->
    _.each @users, (collectionUser, key) ->
      delete @users[key] if collectionUser.username is user.username

  getUser: (username) ->
    _.find @users, (collectionUser) ->
      return collectionUser.username is username

  getSessionUser: (sessionId) ->
    _.find @users, (collectionuser) ->
      return collectionUser.sessionId is sessionId

module.exports = UserCollection