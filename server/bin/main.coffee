Fs = require 'fs'
Path = require 'path'
_ = require 'underscore'

paths =
  config: Path.join __dirname, '..', 'config'
  srcDir: Path.join __dirname, '..', 'src'
  scriptDir: Path.join __dirname, '..', 'scripts'

config = require paths.config
Message = require paths.srcDir + '/message';
command = new (require paths.srcDir + '/command')

app = require('express').createServer()

io = require('socket.io').listen app
io.enable 'browser client minification' if config.socketio.minification
io.enable 'browser client gzip' if config.socketio.gzip
io.enable 'browser client etag' if config.socketio.etag
io.set 'log level', config.socketio.logLevel

clientAssets =
  '/': 'index.html'
  '/config.js': 'config.js'
  '/jquery.terminal.min.js': 'js/lib/jquery.terminal.min.js',
  '/jquery.terminal.css': 'css/jquery.terminal.css'

_.each clientAssets, (assetPath, location) ->
  app.get location, (req, res) ->
    res.sendfile(Path.join __dirname, '../..', 'client', assetPath)

for file in Fs.readdirSync paths.scriptDir
  require(paths.scriptDir + '/' + file)(command)

io.sockets.on 'connection', (socket) ->
  socket.emit 'handshake', message: 'Connected to host.'
  socket.broadcast.emit 'client-status', { message: 'Client connected.', type: 'connect' }

  socket.on 'command-request', (data) ->
    message = new Message(socket, 'command-response', data);
    command.trigger('command-request', message)
    if !message.isHandled()
      message.send { message: 'Invalid command: ' + data.command, type: 'error' }

  socket.on 'disconnect', (data) ->
    message = new Message(socket, 'client-status', data);
    command.trigger('disconnect', message)

console.log 'Nodesole listening on port ' + config.port
app.listen config.port
