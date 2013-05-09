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

	/**
	 * Sets the socket for the user.
	 * @param {[Socket]} socket Socket IO socket object
	 */
	User.prototype.setSocket = function(socket) {
		this.socket = socket;
		this.setClientId(socket.id);
	}

	return User;

}());

module.exports = User;
