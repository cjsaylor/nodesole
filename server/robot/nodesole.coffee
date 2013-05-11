# Description:
#   This script causes Hubot to be the middleman in trasnporting
#   chat messages between Campire/IRC and Nodesole's chat system.
#
# Dependencies:
#   "socket.io-client": "0.9.x"
#
# Configuration:
#   HUBOT_NODESOLE_HOST
#   HUBOT_NODESOLE_ACCESS_KEY
#
# Commands:
#   No commands as it listens to everything
#
# Author:
#   cjsaylor

io = require 'socket.io-client'

socket = io.connect process.env.HUBOT_NODESOLE_HOST,
	query: 'key=' + process.env.HUBOT_NODESOLE_ACCESS_KEY
	

socket.on 'handshake', (data) ->
	console.log 'Nodesole: ' + data.message

module.exports = (robot) ->

	socket.on 'chat-response', (data) ->
		return if data.username is 'Me'
		# send to all configured rooms
		for room in robot.adapter.bot.rooms
			do (room) ->
				robot.messageRoom room, data.username + ' via NS: ' + data.message.replace(/(\n)/gm, '')

	robot.hear /(.*)/i, (msg) ->
		chat = msg.match[1]
		socket.emit 'chat-request', 
			message: msg.message.user.name + ': ' + chat
