module.exports = (command) ->
  command.addHelpString "\tchat [message] - Broadcast [message] to all users."

  command.register 'command-request', (message) ->
    if /^chat /i.test message.data.command
      message.sendAll(message.createMessageText message.data.command.substr 5)
