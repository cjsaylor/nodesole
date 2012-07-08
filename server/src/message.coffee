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

  isHandled: () -> @handled

module.exports = Message