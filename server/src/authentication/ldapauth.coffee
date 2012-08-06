#
# Ldap authentication.
#
# Must be configured under authentication.ldap
#
ldap = require 'ldapjs'
User = require '../user'
logger = require '../logger'
config = require '../../config'

module.exports = (users, req, callback) ->
  logger.debug 'Authenticating via ldap...'
  client = ldap.createClient {
    url: config.authentication.ldap.url
  }
  bindDn = config.authentication.ldap.bindFilter.replace '{{username}}', req.body.username
  client.bind bindDn, req.body.password, (err) ->
    user = false
    if err
      logger.debug 'LDAP Error(' + err.code + ') ' + err.name + ': ' + err.message
    else
      logger.debug 'LDAP authenticated successfully'
      try
        user = new User(req.body.username);
        users.addUser(user);
        req.session.auth = user
      catch e
        # do nothing
    callback(user)