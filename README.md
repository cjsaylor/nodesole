# Nodesole

Nodesole is a collaborative web console tool with scriptable events.

## Requirements

* Node: v0.10.4+

## Installation

You can install from npm:

```shell
npm install nodesole
```

Or from git:

1. Clone repo to a directory
1. Run `npm install`

In either case: copy distribution configuration to runnable configuration:
  * `cp server/config.js-dist server/config.js
  * `cp client/js/config.js-dist client/js/config.js

## Running

```shell
node server/bin/main.js
```

or

```shell
npm start
```

## Extension System

Nodesole's system is extendable by creating a script in the `server/scripts` directory.  This allows
for the creation of custom commands and actions.

See [nodesole-scripts](https://github.com/cjsaylor/nodesole-scripts) for implementation details.

## Socket.io connection via API Key

It is possible to connect to Nodesole's socket.io interface through with use of an access key:

1. Create `api.json` in the root directory of nodesole.
2. Added an array of users you wish to have access via an API key (see `a` below).
3. When creating the connection, set the query option to contain the API key (see `b` below)

`a`:

```
[
	{
		"username": "someuser",
		"key": "a94a8fe5ccb19ba61c4c0873d391e987982fbbd3"
	}
]
```

`b`:

```javascript
var socket = io.connect('localhost', {
	query: 'key=a94a8fe5ccb19ba61c4c0873d391e987982fbbd3'
});
```

## Roadmap

* Test cases for server app.
* Logging throughout event structure of server app.

## Open Source Used

* The brilliant [jquery.terminal](https://github.com/jcubic/jquery.terminal)
* [socket.io](https://github.com/LearnBoost/socket.io)

## License

(The MIT License)

Copyright (c) 2012-2013 Chris Saylor <cjsaylor@gmail.com>

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the 'Software'), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
