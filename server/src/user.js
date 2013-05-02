var User;

User = (function() {

	function User(username) {
		this.username = username;
	}

	User.prototype.setSessionId = function(sessionId) {
		this.sessionId = sessionId;
	};

	User.prototype.setClientId = function(clientId) {
		this.clientId = clientId;
	};

	return User;

}());

module.exports = User;
