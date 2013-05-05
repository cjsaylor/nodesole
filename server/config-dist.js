module.exports = {
	port: 3000,
	sessionSecret: 'supersecret',
	sessionKey: 'nodesole.session',
	logLevel: 'debug',
	authentication: {
		enabled: false,
		handler: 'openauth',
		ldap: {
			url: 'ldap://localhost:389/',
			bindFilter: 'CN={{username}}'
		},
		connectionTimeout: 10
	},
	socketio: {
		gzip: true,
		etag: true,
		minification: true
	},
	plugins: {}
};
