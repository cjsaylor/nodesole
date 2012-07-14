class Message

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
      message: message,
      type: type,
      date: new Date().getTime()
    }

  isHandled: () -> @handled

module.exports = Message