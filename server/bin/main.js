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
		plugin: Path.join(__dirname, '..', 'scripts'),
		client: Path.join(__dirname, '../..', 'client')
	};

	config = require(paths.config);
	Message = require(paths.lib + '/message');
	UserCollection = require(paths.lib + '/usercollection');
	command = new (require(paths.lib + '/command'));
	logger = require(paths.lib + '/logger');
	userCollection = new UserCollection();

	command.setAuthenticatedUsers(userCollection);

	function Main() {
		this.app = express();
		this.server = require('http').createServer(this.app);

		// Setup the express app
		this.app.use(express.compress());
		this.app.use(express.cookieParser(config.sessionSecret));
		this.app.use(express.bodyParser());
		this.app.use(express.methodOverride());
		this.app.use(express.session({
			secret: config.sessionSecret,
			key: config.sessionKey
		}));
		this.app.set('view engine', 'jade');
		this.app.set('views', paths.client);

		// Setup socket.io
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

	}

	Main.prototype.setupClient = function() {
		_.each(['js', 'css'], _.bind(function servePublic(dir) {
			this.app.use('/' + dir, express.static(Path.normalize(paths.client + '/' + dir)));
		}, this));
	};

	Main.prototype.setupRoutes = function() {
		// Main route
		this.app.get('/', function main(req, res) {
			logger.info('Rendering /');
			if (config.authentication.enabled) {
				if (!(req.session.auth != null)) {
					return res.redirect('/login');
				}
				userCollection.restoreUser(req.session.auth);
			} else {
				userCollection.addAnonymousUser(req.sessionID);
			}
			res.render('index');
		});

		// Login route
		this.app.get('/login', function getLogin(req, res) {
			logger.info('Rendering /login');
			if (req.session.auth != null) {
				res.redirect('/');
			}
			res.render('login');
		});
		this.app.post('/login', function postLogin(req, res) {
			var auth;
			auth = Path.join(paths.lib, 'authentication', config.authentication.handler);
			if (Fs.existsSync(auth + '.js')) {
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

		this.app.get('/favicon.ico', function getFavicon(req, res) {
			res.sendfile(paths.client + '/favicon.ico');
		});

		// Not found :(
		this.app.get('*', function notFound(req, res) {
			res.status(404).render('404');
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
