# ws-stomp-server

[![npm version](https://img.shields.io/npm/v/ws-stomp-server.svg?style=flat-square)](https://www.npmjs.com/package/ws-stomp-server)
[![Alt](https://img.shields.io/npm/dt/ws-stomp-server?style=flat-square)](https://npmcharts.com/compare/ws-stomp-server?minimal=true)
![Alt](https://img.shields.io/github/license/mivui/ws-stomp-server?style=flat-square)

## ws-stomp-server is a simple ws stomp server

### install

```shell
npm i ws-stomp-server
```

### http

```ts
import { createServer } from 'http';
import { Stomp } from 'ws-stomp-server';

const server = createServer();
Stomp.server(server, '/ws');
// ws://lcalhost/ws
```

### express

```ts
import express from 'express';
import { Stomp } from 'ws-stomp-server';

const app = express();
const server = app.listen();
Stomp.server(server, '/ws');
// ws://lcalhost/ws
```

### publish

```ts
import { Stomp } from 'ws-stomp-server';

function publish() {
  Stomp.publish('/example', JSON.stringify({ name: 'example' }), { token: 'example' });
}
```

### subscribe

```ts
import { Stomp } from 'ws-stomp-server';

function subscribe() {
  Stomp.subscribe('/example', (e) => {
    const body = e.body;
  });
}
```

### subscribe

```ts
import { Stomp } from 'ws-stomp-server';

function unsubscribe() {
  Stomp.unsubscribe('/example');
}
```

### server and client

### server.js

```ts
import express from 'express';
import { Stomp } from 'ws-stomp-server';

const app = express();
app.get('/send', (_, res) => {
  Stomp.send('/topic/something', 'payload');
  res.status(200).json({});
});
const server = app.listen(8080);
Stomp.server(server, '/ws');
Stomp.subscribe('/topic/greetings', (message) => {
  console.log(message.body);
});
```

### browser.js

```ts
import { Client } from '@stomp/stompjs';

const client = new Client({
  brokerURL: 'ws://localhost:8080/ws',
  onConnect: () => {
    client.publish({ destination: '/topic/greetings', body: 'Hello Word!' });
    client.subscribe('/topic/something', (message) => {
      console.log(message.body);
    });
  },
});
client.activate();
```
