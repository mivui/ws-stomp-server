import { type Server as HTTPServer } from 'http';
import { type Server as HTTPSServer } from 'https';

import { type AuthProvider } from './auth.js';
import { Autowired } from './autowired.js';
import { type StompFrame } from './frame.js';
import { StompServer } from './server.js';

const className = 'stompServer';

export default class Stomp {
  private constructor() {}

  public static server(
    server: HTTPServer | HTTPSServer,
    path: string,
    authProvider?: AuthProvider,
  ) {
    const stomp = StompServer.server({ server, path, authProvider });
    Autowired.register(className, stomp);
  }

  public static send(destination: string, body: string, headers: Record<string, string> = {}) {
    const server = Autowired.get<StompServer>(className);
    server?.send(destination, body, headers);
  }

  public static subscribe(destination: string, callback: (frame: StompFrame) => void) {
    const server = Autowired.get<StompServer>(className);
    server?.subscribe(destination, callback);
  }

  public static unsubscribe(destination: string) {
    const server = Autowired.get<StompServer>(className);
    server?.unsubscribe(destination);
  }
}
