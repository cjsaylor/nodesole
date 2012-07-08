path = require 'path'
config = require path.join(__dirname, '..', 'config')

app = require('express').createServer()
io = require('socket.io').listen app

app.get '/', (req, res) ->
  res.sendfile(path.join __dirname, '../..', 'client/index.html');

app.get '/config.js', (req, res) ->
  res.sendfile(path.join __dirname, '../..', 'client/config.js');

io.sockets.on 'connection', (socket) ->
  console.log 'Connection event fired.'
  socket.emit 'handshake', message: 'Connected to host.'
  socket.broadcast.emit 'client-status', { message: 'Client connected.', type: 'connect' }
  socket.on 'command-request', (data) ->
    console.log 'Command-request received.'
    message = if data.command is 'test' then 'Test out!' else  'Invalid command: ' + data.command
    socket.emit 'command-response', message: message
    socket.broadcast.emit 'command-response', message: message
  socket.on 'disconnect', () ->
    socket.broadcast.emit 'client-status', { message: 'Client disconnected.', type: 'disconnect' }

console.log 'Nodesole listening on port ' + config.port
app.listen config.port
