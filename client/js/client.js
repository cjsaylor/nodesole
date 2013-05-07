$(function domReady() {
	var terminal, socket, $chatInput, $chatInputForm, $chatOutput;

	// Cache app elements
	$terminal = $('#terminal');
	$chat = $('#chat');
	$chatInput = $('#chat-message');
	$chatInputForm = $('#chat-input-form');
	$chatOutput = $('#chat-output');

	var Util = {
		echo: function(message, type) {
			if (typeof terminal === 'undefined') {
				terminal = $terminal.terminal();
			}
			if (terminal !== null) {
				switch (type) {
					case 'error': terminal.error(String(message)); break;
					case 'connect': terminal.echo('[[i;#00FF00;#000]' + String(message)) + ']'; break;
					case 'info':
					case 'disconnect': terminal.echo('[[i;#606060;#000]' + String(message)) + ']'; break;
					default:
						terminal.echo(String(message));
				}
			}
		},
		resizeApp: function(e) {
			var width = $(window).width(),
				height = $(window).height();
			if (width < 1024) {
				return;
			}
			$terminal.width(Math.floor(width * 0.75) - 80);
			$chat.width(Math.floor(width * 0.25));
			$chatOutput.height(Math.floor(height - $chatInput.height() - 150));
			$chatInput.width(Math.floor($chat.width()));
		}
	};

	// Setup terminal
	$('#terminal')
		.terminal(function(command, term) {
			terminal = term;
			if (command !== '') {
				socket.emit('command-request', {command: command});
			}
		}, {
			greetings: nodesole.motd,
			prompt: nodesole.prompt
		})
		.on('click', function(e) {
			e.preventDefault();
			terminal.enable();
		})
		.on('blur', function(e) {
			e.preventDefault();
			terminal.enable();
		})

	// Chat implementation
	$chatInput
		.on('keyup', function(e) {
			var code = (e.keyCode ? e.keyCode : e.which);
			if (code == 13 && $chatInput.val().trim().length == 0) {
				$chatInput.val('');
			} else if (code == 13) {
				$chatInputForm.submit();
			}
		})
	$chatInputForm.on('submit', function(e) {
		e.preventDefault();
		socket.emit('chat-request', {message: $chatInput.val()});
		$chatInput.val('');
	});

	// Server connection
	var socket = io.connect(nodesole.server);
	socket
		.on('handshake', function handshakeResponse(data) {
			Util.echo(data.message);
		})
		.on('command-response', function commandResponse(data) {
			Util.echo(data.message, typeof data.type !== 'undefined' ? data.type : null);
		})
		.on('chat-response', function chatResponse(data) {
			var now = new Date();
			$chatOutput.append(
				$('<p/>').text(
					now.toTimeString() + ' - ' + data.username + ': ' + data.message
				)
			);
			$chatOutput.scrollTop($chatOutput.prop('scrollHeight'));
		})
		.on('client-status', function clientStatusResponse(data) {
			Util.echo(data.message, typeof data.type !== 'undefined' ? data.type : null);
		});

	// Handle application display
	$(window).on('resize', Util.resizeApp);
	Util.resizeApp(null);
});