var Fs, Main, Path, cookie, express, main, socketLogLevels, _;

// Allow coffeescript requires
require('coffee-script');

Fs = require('fs');
Path = require('path');
_ = require('underscore');
express = require('express');
socketLogLevels = ['error', 'warn', 'info', 'debug'];

Main = (function() {
	var Message, UserCollection, clientAssets, command, config, io, logger, paths, userCollection, app, server;

	paths = {
		config: Path.join(__dirname, '..', 'config'),
		lib: Path.join(__dirname, '..', 'src'),
		plugin: Path.join(__dirname, '..', 'scripts')
	};

	config = require(paths.config);
	Message = require(paths.lib + '/message');
	UserCollection = require(paths.lib + '/usercollection');
	command = new (require(paths.lib + '/command'));
	logger = require(paths.lib + '/logger');
	userCollection = new UserCollection();

	command.setAuthenticatedUsers(userCollection);

	clientAssets = {
		'/config.js': 'config.js',
		'/client.js': 'js/client.js',
		'/jquery.terminal.min.js': 'js/lib/jquery.terminal.min.js',
		'/jquery.terminal.css': 'css/jquery.terminal.css',
		'/main.css': 'css/main.css',
		'/favicon.ico': 'favicon.ico',
		'/login': 'login.html'
	};

	function Main() {
		this.app = express();
		this.server = require('http').createServer(this.app);
		io = require('socket.io').listen(this.server);
		if (config.socketio.minification) {
			io.enable('browser client minification');
		}
		if (config.socketio.gzip) {
			io.enable('browser client gzip');
		}
		if (config.socketio.etag) {
			io.enable('browser client etag');
		}
		io.set('logger', {
			debug: logger.debug,
			info: logger.info,
			warn: logger.warn,
			error: logger.error
		});
		io.set('log level', socketLogLevels.indexOf(config.logLevel));
		io.set('authorization', function(data, accept) {
			var user;
			if (data.headers.cookie) {
				var cookies = require('express/node_modules/cookie').parse(data.headers.cookie), 
					parsed = require('express/node_modules/connect/lib/utils').parseSignedCookies(cookies, config.sessionSecret);
				data.sessionID = parsed[config.sessionKey] || null;
				user = userCollection.getSessionUser(data.sessionID);
				if (!(user != null)) {
					accept('Unauthorized.', false);
					return;
				}
				accept(null, true);
			}
		});
		this.app.use(express.cookieParser(config.sessionSecret));
		this.app.use(express.bodyParser());
		this.app.use(express.methodOverride());
		this.app.use(express.session({
			secret: config.sessionSecret,
			key: config.sessionKey
		}));
	}

	Main.prototype.setupClient = function() {
		var app;
		app = this.app;
		_.each(clientAssets, function(assetPath, location) {
			app.get(location, function(req, res) {
				res.sendfile(Path.join(__dirname, '../..', 'client', assetPath));
			});
		});
	};

	Main.prototype.setupRoutes = function() {
		// Main route
		this.app.get('/', function(req, res) {
			if (config.authentication.enabled) {
				if (!(req.session.auth != null)) {
					return res.redirect('/login');
				}
				userCollection.restoreUser(req.session.auth);
			} else {
				userCollection.addAnonymousUser(req.sessionID);
			}
			res.sendfile(Path.join(__dirname, '../..', 'client/index.html'));
		});
		// Login route
		this.app.get('/login', function(req, res) {
			if (req.session.auth != null) {
				res.redirect('/');
			}
			res.sendfile(Path.join(__dirname, '../..', 'client/login.html'));
		});
		this.app.post('/login', function(req, res) {
			var auth;
			auth = Path.join(paths.lib, 'authentication', config.authentication.handler);
			if (Path.existsSync(auth + '.js')) {
				require(auth)(userCollection, req, function(user) {
					if (user === false) {
						res.redirect('/login');
					} else {
						user.setSessionId(req.sessionID);
						res.redirect('/');
					}
				});
			} else {
				logger.error('Configured authentication handler not found: ' + auth);
			}
		});
	};

	Main.prototype.setupCustomScripts = function() {
		var plugins = Fs.readdirSync(paths.plugin);
		_.each(plugins, _.bind(function initializePlugins(plugin) {
			if (Path.extname(plugin) !== '.coffee' && Path.extname(plugin) !== '.js') {
				logger.debug('Plugin load skipping: ' + plugin);
				return;
			}
			logger.debug('Initializing plugin: ' + plugin);
			require(paths.plugin + '/' + plugin)(command);
		}, this));
	};

	Main.prototype.startIO = function() {
		io.sockets.on('connection', function(socket) {
			var user;
			user = userCollection.getSessionUser(socket.handshake.sessionID);
			if (user != null) {
				user.setClientId(socket.id);
			}
			socket.emit('handshake', {
				message: 'Connected to host.'
			});
			socket.broadcast.emit('client-status', {
				message: user.username + ' connected.',
				type: 'connect'
			});
			socket.on('command-request', function(data) {
				var message;
				data.user = userCollection.getClientUser(socket.id);
				message = new Message(socket, 'command-response', data);
				command.trigger('command-request', message);
				if (!message.isHandled()) {
					message.send({
						message: 'Invalid command: ' + data.command,
						type: 'error'
					});
				}
			});
			socket.on('chat-request', function(data) {
				var message;
				data.user = userCollection.getClientUser(socket.id);
				message = new Message(socket, 'chat-response', data);
				command.trigger('chat-request', message);
			});
			socket.on('disconnect', function() {
				var data, message;
				data = {};
				data.user = userCollection.getClientUser(socket.id);
				if (data.user != null) {
					message = new Message(socket, 'client-status', data);
					command.trigger('disconnect', message);
					logger.debug('Removing user from collection: ' + socket.id);
					userCollection.removeUser(data.user);
				}
			});
		});
	};

	Main.prototype.run = function() {
		this.setupClient();
		this.setupRoutes();
		this.setupCustomScripts();
		this.startIO();
		this.server.listen(config.port, function() {
			logger.info('Nodesole listening on port ' + config.port);
		});
	};

	return Main;

}());

module.exports = main = new Main();

main.run();
