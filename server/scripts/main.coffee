module.exports = (command) ->

  commands =
    help: /^help$/i
    ns_list: /^ns list$/i

  command.addHelpString '\tns list - List all authenticated users connected.\n'

  command.register 'command-request', (message) ->
    # help
    if commands.help.test(message.data.command)
      helpText = "Nodesole help menu\n"
      helpText += command.helpToString()
      message.send(message.createMessageText helpText)
    # ns list
    if commands.ns_list.test(message.data.command)
      message.send(message.createMessageText message.createMessageText '\t' + command.userCollection.toString())

  command.register 'chat-request', (message) ->
    packet =
      username: message.data.user.username
      message: message.data.message
      html: false
    message.broadcast message.createMessageText(packet)
    packet.username = 'Me'
    message.send message.createMessageText(packet)

  command.register 'disconnect', (message) ->
    message.broadcast message.createMessageText message.data.user.username + ' disconnected.', type: 'disconnect'
