
var INVALID_AUTH, User, config, ldap, logger;

ldap = require('ldapjs');
User = require('../user');
logger = require('../logger');
config = require('../../config');

INVALID_AUTH = 49;

module.exports = function(users, req, callback) {
	var bindDn, client;
	logger.debug('Authenticating via ldap...');
	client = ldap.createClient({
		url: config.authentication.ldap.url,
		connectTimeout: config.authentication.ldap.connectTimeout * 1000
	});
	bindDn = config.authentication.ldap.bindFilter.replace('{{username}}', req.body.username);
	return client.bind(bindDn, req.body.password, function(err) {
		var msg, user;
		user = false;
		if (err) {
			msg = 'LDAP Error(' + err.code + ') ' + err.name + ': ' + err.message;
			if (err.code === INVALID_AUTH) {
				logger.debug(msg);
			} else {
				logger.error(msg);
			}
		} else {
			logger.debug('LDAP authenticated successfully');
			try {
				user = new User(req.body.username);
				users.addUser(user);
			} catch (e) {
				logger.debug('User already in collection.');
			}
			req.session.auth = user;
		}
		return callback(user);
	});
};
