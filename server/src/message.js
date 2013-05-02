var Message;

Message = (function() {

	function Message(socket, event, data) {
		this.socket = socket;
		this.event = event;
		this.data = data;
	}

	Message.prototype.send = function(packet, event) {
		var sendEvent;
		sendEvent = event || this.event;
		this.socket.emit(sendEvent, packet);
		return this.handled = true;
	};

	Message.prototype.broadcast = function(packet, event) {
		var sendEvent;
		sendEvent = event || this.event;
		this.socket.broadcast.emit(sendEvent, packet);
		return this.handled = true;
	};

	Message.prototype.sendAll = function(packet, event) {
		this.send(packet, event);
		return this.broadcast(packet, event);
	};

	Message.prototype.createMessageText = function(message, type) {
		type = type || 'none';
		return {
			message: message,
			type: type,
			date: new Date().getTime()
		};
	};

	Message.prototype.isHandled = function() {
		return this.handled;
	};

	return Message;

}());

module.exports = Message;
