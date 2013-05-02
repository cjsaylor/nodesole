
var User, logger;

User = require('../user');
logger = require('../logger');

module.exports = function(users, req, callback) {
	var user;
	logger.debug('Authenticating using openauth...');
	user = false;
	try {
		user = new User(req.body.username);
		users.addUser(user);
		req.session.auth = user;
	} catch (e) {
		logger.error(e.message);
	}
	return callback(user);
};
