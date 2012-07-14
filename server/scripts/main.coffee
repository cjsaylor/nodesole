module.exports = (command) ->
  command.register 'command-request', (message) ->
    if /^help$/i.test(message.data.command) and not /^help $/i.test(message.data.command)
      helpText = "Nodesole help menu\n"
      helpText += command.helpToString()
      message.send(message.createMessageText helpText)

  command.register 'disconnect', (message) ->
    message.broadcast {
      message: 'Client disconnected.',
      type: 'disconnect'
    }
