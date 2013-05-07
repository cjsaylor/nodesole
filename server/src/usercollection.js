var User, UserCollection, _;

_ = require('underscore');
User = require(__dirname + '/user');

UserCollection = (function() {

	function UserCollection() {
		this.users = [];
	}

	UserCollection.prototype.addUser = function(user) {
		var exists;
		exists = this.getUser(user.username);
		if (exists) {
			throw {
				error: 'duplicate-user',
				message: 'Username is already in use.'
			};
		}
		return this.users.push(user);
	};

	UserCollection.prototype.addAnonymousUser = function(sessionId) {
		var user, username;
		username = 'Client #' + ('00000' + Math.round(Math.random() * 1000, 0)).slice(-5);
		user = new User(username);
		user.setSessionId(sessionId);
		try {
			return this.addUser(user);
		} catch (e) {

		}
	};

	UserCollection.prototype.removeUser = function(user) {
		return _.each(this.users, _.bind(function(collectionUser, key) {
			if (collectionUser.username === user.username) {
				return delete this.users[key];
			}
		}, this));
	};

	UserCollection.prototype.restoreUser = function(session) {
		var user;
		if (!(session.username != null)) {
			return false;
		}
		user = this.getUser(session.username);
		if (!(user != null)) {
			user = new User(session.username);
			user.setSessionId(session.sessionId);
		}
		user.setClientId(null);
		try {
			this.addUser(user);
		} catch (e) {

		}
		return user;
	};

	UserCollection.prototype.getUser = function(username) {
		return _.find(this.users, function(collectionUser) {
			return collectionUser.username === username;
		});
	};

	UserCollection.prototype.getSessionUser = function(sessionId) {
		return _.find(this.users, function(collectionUser) {
			return collectionUser.sessionId === sessionId;
		});
	};

	UserCollection.prototype.getClientUser = function(clientId) {
		return _.find(this.users, function(collectionUser) {
			return collectionUser.clientId === clientId;
		});
	};

	UserCollection.prototype.toString = function() {
		var usernames;
		usernames = [];
		_.each(this.users, function(collectionUser) {
			return usernames.push(collectionUser.username);
		});
		return usernames.toString();
	};

	return UserCollection;

}());

module.exports = UserCollection;
