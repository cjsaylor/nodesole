#!/usr/bin/env coffee

Fs = require 'fs'
Path = require 'path'
_ = require 'underscore'
express = require 'express'
cookie = require 'cookie'

class Main

  io = null

  paths =
    config: Path.join __dirname, '..', 'config'
    srcDir: Path.join __dirname, '..', 'src'
    scriptDir: Path.join __dirname, '..', 'scripts'

  config = require paths.config
  Message = require paths.srcDir + '/message'
  UserCollection = require paths.srcDir + '/usercollection'
  command = new (require paths.srcDir + '/command')

  userCollection = new UserCollection()

  clientAssets =
    '/config.js': 'config.js'
    '/jquery.terminal.min.js': 'js/lib/jquery.terminal.min.js',
    '/jquery.terminal.css': 'css/jquery.terminal.css',
    '/favicon.ico': 'favicon.ico',
    '/login': 'login.html'

  constructor: ->
    @app = express.createServer()

    # Create the socket io listener
    io = require('socket.io').listen @app
    io.enable 'browser client minification' if config.socketio.minification
    io.enable 'browser client gzip' if config.socketio.gzip
    io.enable 'browser client etag' if config.socketio.etag
    io.set 'log level', config.socketio.logLevel
    io.set 'authorization', (data, accept) ->
      if data.headers.cookie
        data.sessionID = cookie.parse(data.headers.cookie)[config.sessionKey]
        user = userCollection.getSessionUser data.sessionID
        if not user?
          return accept 'Unauthorized.', false
        accept null, true

    # setup express middleware
    @app.use express.cookieParser()
    @app.use express.bodyParser()
    @app.use express.methodOverride()
    @app.use express.session
      secret: config.sessionSecret
      key: config.sessionKey

  # Assign uri paths to client assets
  setupClient: ->
    app = @app
    _.each clientAssets, (assetPath, location) ->
      app.get location, (req, res) ->
        res.sendfile(Path.join __dirname, '../..', 'client', assetPath)

  # Route main level
  setupRoutes: ->
    @app.get '/', (req, res) ->
      # Check for authentication
      if config.authentication.enabled
        return res.redirect '/login' if not req.session.auth?
      res.sendfile(Path.join __dirname, '../..', 'client/index.html')

    @app.get '/login', (req, res) ->
      res.redirect '/' if req.session.auth?
      res.sendfile(Path.join __dirname, '../..', 'client/login.html')

    @app.post '/login', (req, res) ->
      # Inject configured authentication handler
      auth = Path.join paths.srcDir, 'authentication', config.authentication.handler
      if Path.existsSync(auth + '.coffee')
        user = require(auth)(userCollection, req)
      else
        console.log 'Configured authentication handler not found: ' + auth
      if user is false
        res.redirect '/login' 
      else
        if not user.sessionId?
          user.setSessionId req.sessionID
        res.redirect '/'

  # Register custom scripts in the script path
  setupCustomScripts: ->
    for file in Fs.readdirSync paths.scriptDir
      require(paths.scriptDir + '/' + file)(command) if Path.extname(file) is '.coffee'

  # start the socket IO listener/emitter
  startIO: ->
    io.sockets.on 'connection', (socket) ->
      # Add socket client id to user object
      user = userCollection.getSessionUser socket.handshake.sessionID
      if user?
        user.setClientId socket.id
      socket.emit 'handshake', message: 'Connected to host.'
      socket.broadcast.emit 'client-status', { message: 'Client connected.', type: 'connect' }

      socket.on 'command-request', (data) ->
        console.log userCollection
        data.user = userCollection.getClientUser socket.id
        message = new Message socket, 'command-response', data
        command.trigger 'command-request', message
        if !message.isHandled()
          message.send { message: 'Invalid command: ' + data.command, type: 'error' }
    
      socket.on 'chat-request', (data) ->
        message = new Message socket, 'chat-response', data
        command.trigger 'chat-request', message
    
      socket.on 'disconnect', (data) ->
        user = userCollection.getClientUser socket.id
        if user?
          userCollection.removeUser user
        message = new Message(socket, 'client-status', data);
        command.trigger('disconnect', message)

  # Prepare and start the application
  run: ->
    @.setupClient()
    @.setupRoutes()
    @.setupCustomScripts()
    @.startIO()
    console.log 'Nodesole listening on port ' + config.port
    @app.listen config.port

module.exports = main = new Main()
main.run()
