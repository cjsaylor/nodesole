class Message

  parseSpecialChars = (str) ->
    str = str.replace /\t/gi, '&nbsp;&nbsp;&nbsp;&nbsp;'
    str = str.replace /\n/gi, '<br>'

  constructor: (@socket, @event, @data) ->

  send: (packet, event) ->
    sendEvent = event || @event
    @socket.emit sendEvent, packet
    @handled = true

  broadcast: (packet, event) ->
    sendEvent = event || @event
    @socket.broadcast.emit sendEvent, packet
    @handled = true

  sendAll: (packet, event) ->
    @.send(packet, event)
    @.broadcast(packet, event)

  createMessageText: (message, type) ->
    type = type || 'none'
    return {
      message: parseSpecialChars(message),
      type: type,
      date: new Date().getTime()
    }

  isHandled: () -> @handled

module.exports = Message