User = require '../user'

module.exports = (users, req) ->
  # See if user is in the collection
  user = false
  try
    user = new User(req.body.username);
    users.addUser(user);
    req.session.auth = user
  catch e
    console.log e.message
    return false
  true