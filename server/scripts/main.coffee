module.exports = (command) ->
  command.register 'command-request', (message) ->
    if message.data.command is 'test'
      message.sendAll {
        message: 'Test out!'
      }

  command.register 'disconnect', (message) ->
    message.broadcast {
      message: 'Client disconnected.',
      type: 'disconnect'
    }
