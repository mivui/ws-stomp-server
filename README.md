# ws-stomp

[![npm version](https://img.shields.io/npm/v/ws-stomp.svg?style=flat-square)](https://www.npmjs.com/package/ws-stomp)
[![Alt](https://img.shields.io/npm/dt/ws-stomp?style=flat-square)](https://npmcharts.com/compare/ws-stomp?minimal=true)
![Alt](https://img.shields.io/github/license/mivui/node-ws-stomp?style=flat-square)

### ws-stomp is a simple Node.js server base on websocket stomp

### install

```shell
npm i ws-stomp
```

### http

```ts
import { createServer } from 'http';
import wsstomp from 'ws-stomp';

const server = createServer();
wsstomp.server(server, '/ws');
server.listen(3000);
// ws://lcalhost:3000/ws
```

### send

```ts
import wsstomp from 'ws-stomp';

function publish() {
  wsstomp.send('/topic/something', JSON.stringify({ name: 'name' }), { token: 'token' });
}
```

### subscribe

```ts
import wsstomp from 'ws-stomp';

function subscribe() {
  wsstomp.subscribe('/topic/greetings', (e) => {
    const body = e.body;
  });
}
```

### unsubscribe

```ts
import wsstomp from 'ws-stomp';

function unsubscribe() {
  wsstomp.unsubscribe('/topic/greetings');
}
```

### server and client

### server.js

```ts
import express from 'express';
import wsstomp from 'ws-stomp';

const app = express();
app.get('/send', (_, res) => {
  wsstomp.send('/topic/something', 'payload');
  res.status(200).json({});
});
const server = app.listen(3000);
wsstomp.server(server, '/ws');
wsstomp.subscribe('/topic/greetings', (message) => {
  console.log(message.body);
});
```

### browser.js

```ts
import { Client } from '@stomp/stompjs';

const client = new Client({
  brokerURL: 'ws://lcalhost:3000/ws',
  onConnect: () => {
    client.publish({ destination: '/topic/greetings', body: 'Hello World!' });
    client.subscribe('/topic/something', (message) => {
      console.log(message.body);
    });
  },
});
client.activate();
```
