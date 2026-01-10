import { type Server as HTTPServer } from 'http';
import { type Server as HTTPSServer } from 'https';
import { v4 as uuid } from 'uuid';
import WebSocket from 'ws';
import { WebSocketServer } from 'ws';

import { type AuthProvider } from './auth.js';
import { BYTE, StompCommand, StompFrame } from './frame.js';

export interface SubscribeClient {
  id: string;
  destination: string;
  ws: WebSocket;
}

export type SubscribeHandler = (frame: StompFrame) => void;

export interface StompServerConstructor {
  server: HTTPServer | HTTPSServer;
  path: string;
  authProvider?: AuthProvider;
}

export class StompServer {
  private readonly ws: WebSocketServer;
  private subscribeClients: SubscribeClient[] = []; //已订阅的客户端
  private readonly subscribehandler = new Map<string, SubscribeHandler>(); //服务端订阅处理
  private readonly authProvider?: AuthProvider;

  private constructor(options: StompServerConstructor) {
    const { server, path, authProvider } = options;
    this.authProvider = authProvider;
    this.ws = new WebSocketServer({ server, path });
    this.ws.on('connection', (ws) => {
      ws.on('message', (data: Buffer) => {
        this.handleMessage(data, ws);
      });
      ws.on('close', () => {
        this.cleanupSubscriptions(ws);
      });
    });
  }

  public static server(options: StompServerConstructor) {
    return new StompServer(options);
  }

  private async handleMessage(data: Buffer, ws: WebSocket) {
    try {
      const frame = StompFrame.parse(data);
      // console.log(frame);
      switch (frame.command) {
        case StompCommand.CONNECT:
          await this.handleConnect(frame, ws);
          break;
        case StompCommand.SEND:
          this.handleSend(frame, ws);
          break;
        case StompCommand.SUBSCRIBE:
          this.handleSubscribe(frame, ws);
          break;
        case StompCommand.UNSUBSCRIBE:
          this.handleUnsubscribe(frame, ws);
          break;
        case StompCommand.DISCONNECT:
          this.handleDisconnect(ws);
          break;
        case StompCommand.PING: {
          this.cleanupWebsockets();
          const timer = setTimeout(() => {
            clearTimeout(timer);
            ws.ping();
            ws.send(BYTE.LF);
          }, 1000);
          // console.log('ping');
          break;
        }
        case StompCommand.ACK:
        case StompCommand.NACK:
          break;
        default:
          this.sendError(ws, `Unsupported command: ${frame.command}`);
      }
    } catch (error) {
      console.log(error);
      this.sendError(ws, 'Invalid frame format');
    }
  }

  private async handleConnect(frame: StompFrame, ws: WebSocket) {
    // 认证检查（如果启用）
    if (this.authProvider && !(await this.authProvider.authenticate(frame))) {
      this.sendError(ws, 'Authentication failed');
      ws.close();
      return;
    }
    const heartBeat = frame.headers['heart-beat'] || '0,0';
    const connectedFrame = new StompFrame(StompCommand.CONNECTED, {
      version: '1.2',
      'heart-beat': heartBeat,
    });
    ws.send(connectedFrame.serialize());
  }

  private handleSend(frame: StompFrame, _ws: WebSocket) {
    const { destination } = frame.headers;
    this.subscribehandler.forEach((callback, key) => {
      if (destination === key) {
        callback(frame);
      }
    });
  }

  private handleSubscribe(frame: StompFrame, ws: WebSocket) {
    const subId = frame.headers.id;
    const { destination } = frame.headers;
    if (!subId || !destination) {
      this.sendError(ws, 'Missing subscription headers');
      return;
    }
    this.subscribeClients.push({
      id: subId,
      destination,
      ws,
    });
  }

  private handleUnsubscribe(frame: StompFrame, ws: WebSocket) {
    const subId = frame.headers.id;
    this.subscribeClients = this.subscribeClients.filter(
      (sub) => !(sub.id === subId && sub.ws === ws),
    );
  }

  private handleDisconnect(ws: WebSocket) {
    this.cleanupSubscriptions(ws);
    ws.close();
  }

  // 清理断开连接的订阅
  private cleanupSubscriptions(ws: WebSocket) {
    this.subscribeClients = this.subscribeClients.filter((sub) => sub.ws !== ws);
  }

  // 清理断开连接的WebSocket
  private cleanupWebsockets() {
    this.subscribeClients = this.subscribeClients.filter(
      (sub) => sub.ws.readyState === WebSocket.OPEN,
    );
  }

  // 服务端主动发送消息
  public send(destination: string, body: string, headers: Record<string, string> = {}) {
    const subs = this.subscribeClients.filter((sub) => sub.destination === destination);
    if (subs.length) {
      subs.forEach((sub) => {
        const frame = new StompFrame(
          StompCommand.MESSAGE,
          {
            destination,
            'message-id': uuid(),
            timestamp: `${Date.now()}`,
            subscription: sub.id,
            ...headers,
          },
          body,
        );
        if (sub.ws.readyState === WebSocket.OPEN) {
          sub.ws.send(frame.serialize());
        }
      });
      return;
    }
    console.log(`${destination} unsubscribed client!`);
  }

  public subscribe(destination: string, callback: (frame: StompFrame) => void) {
    this.subscribehandler.set(destination, callback);
  }

  public unsubscribe(destination: string) {
    this.subscribehandler.delete(destination);
  }

  private sendError(ws: WebSocket, message: string) {
    const errorFrame = new StompFrame(
      StompCommand.ERROR,
      { 'content-type': 'text/plain' },
      message,
    );
    ws.send(errorFrame.serialize());
  }
}
