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
		root: Path.join(__dirname, '../..'),
		config: Path.join(__dirname, '..', 'config'),
		lib: Path.join(__dirname, '..', 'src'),
		plugin: Path.join(__dirname, '..', 'scripts'),
		client: Path.join(__dirname, '../..', 'client')
	};

	config = require(paths.config);
	Message = require(paths.lib + '/message');
	UserCollection = require(paths.lib + '/usercollection');
	User = require(paths.lib + '/user');
	command = new (require(paths.lib + '/command'));
	logger = require(paths.lib + '/logger');

	userCollection = new UserCollection();

	command.setAuthenticatedUsers(userCollection);

	function Main() {
		this.app = express();
		this.server = require('http').createServer(this.app);

		// Setup the express app
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
			var user, apiUsers, apiUser, cookies;
			if (data.headers.cookie) {
				cookies = require('express/node_modules/connect/lib/utils').parseSignedCookies(
					require('express/node_modules/cookie').parse(data.headers.cookie), 
					config.sessionSecret
				);
				data.sessionID = cookies[config.sessionKey] || null;
				user = userCollection.getSessionUser(data.sessionID);
				if (!user) {
					return accept('Unauthorized.', false);
				}
				return accept(null, true);
			} else if (typeof data.query.key != 'undefined') {
				try {
					apiUsers = require(paths.root + '/api.json');
				} catch (e) {
					return accept('API Key file not defined.', false);
				}
				
				if (!apiUsers) {
					return accept('No API key defined.', false);
				}
				user = _.find(apiUsers, function(apiUser) {
					return data.query.key === apiUser.key;
				});
				if (!user) {
					return accept('Invalid API key.', false);
				}
				user = new User(user.username);
				userCollection.addUser(user);
				return accept(null, true);
			}
			accept('No authorization mechanism could authorize.', false);
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
			var user;
			logger.info('Rendering /');
			if (config.authentication.enabled) {
				if (!(req.session.auth != null)) {
					return res.redirect('/login');
				}
				user = userCollection.restoreUser(req.session.auth);
			} else {
				user = userCollection.addAnonymousUser(req.sessionID);
			}
			res.render('index', {
				username: user.username
			});
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
			var authHandler;
			try {
				authHandler = require(Path.join(paths.lib, 'authentication', config.authentication.handler) + '.js');
			} catch (e) {
				logger.error('Configured authentication handler not found.');
				return res.redirect('/login');
			}
			authHandler(userCollection, req, function authHandlerCallback(user) {
				if (user === false) {
					res.redirect('/login');
				} else {
					user.setSessionId(req.sessionID);
					res.redirect('/');
				}
			});
		});

		// Logout route
		this.app.get('/logout', function getLogout(req, res) {
			logger.info('Processing logout.');
			if (!req.session.auth) {
				res.redirect('/login');
				return;
			}
			var user = userCollection.getUser(req.session.auth.username);
			if (user) {
				logger.debug('Removing user from collection');
				user.socket.disconnect();
				userCollection.removeUser(user);
			}
			req.session.auth = null;
			res.redirect('/login')
		});

		this.app.get('/favicon.ico', function getFavicon(req, res) {
			res.sendfile(paths.client + '/favicon.ico');
		});

		// Not found :(
		this.app.get('*', function notFound(req, res) {
			logger.info('Not found: ' + req.path);
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
			if (!user) {
				socket.disconnect();
				return;
			}
			user.setSocket(socket);
			socket.emit('handshake', {
				message: 'Connected to host.',
				type: 'connect'
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
