# Nodesole

Nodesole is a collaborative web console tool with scriptable events.

## Requirements

* Node: v0.6.10+
* Coffee-script: v1.3.3+

## Installation

1. Clone repo to a directory
1. Run `npm install`
1. Copy distribution configuration to runnable configuration:
  * `cp server/config.coffee-dist server/config.coffee
  * `cp client/config.js-dist client/config.js

## Running

```shell
coffee server/bin/main.coffee
```

## Extension System

Nodesole's system is extendable by creating a script in the `server/scripts` directory.  This allows
for the creation of custom commands and actions.

See [nodesole-scripts](https://github.com/cjsaylor/nodesole-scripts) for implementation details.

## Roadmap

* User authentication (ldap hook, github oauth, etc)
* Small json API for posting events to chat/console.
* Organize client app with backbone.js.
* Test cases for server app.
* Logging throughout event structure of server app.

## Open Source Used

* The brilliant [jquery.terminal](https://github.com/jcubic/jquery.terminal)
* [socket.io](https://github.com/LearnBoost/socket.io)

## License

(The MIT License)

Copyright (c) 2012 Chris Saylor <cjsaylor@gmail.com>

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the 'Software'), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.