
var Command, _;

_ = require('underscore');

Command = (function() {
	var config, events, help;

	events = {
		'command-request': [],
		'chat-request': [],
		'disconnect': []
	};

	help = ["\thelp - Display this help message\n"];

	config = {};

	function Command() {
	}

	Command.prototype.setAuthenticatedUsers = function(userCollection) {
		this.userCollection = userCollection;
	};

	Command.prototype.register = function(event, callback) {
		if (_.has(events, event)) {
			return events[event].push(callback);
		}
	};

	Command.prototype.trigger = function(event, message) {
		if (_.has(events, event)) {
			_.each(events[event], function(func) {
				return func(message);
			});
		}
	};

	Command.prototype.addHelpString = function(str) {
		return help.push(str);
	};

	Command.prototype.getConfig = function(script, key) {
		return config[script][key];
	};

	Command.prototype.setConfig = function(script, key, value) {
		return config[script][key] = value;
	};

	Command.prototype.helpToString = function() {
		return help.join('');
	};

	return Command;

}());

module.exports = Command;

