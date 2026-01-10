import { type Server as HTTPServer } from 'http';
import { type Server as HTTPSServer } from 'https';

import { type AuthProvider } from './auth.js';
import { Autowired } from './autowired.js';
import { type StompFrame } from './frame.js';
import { StompServer } from './server.js';

const className = 'stompServer';

export class Stomp {
  private constructor() {}

  public static server(
    server: HTTPServer | HTTPSServer,
    path: string,
    authProvider?: AuthProvider,
  ) {
    const stomp = StompServer.server({ server, path, authProvider });
    Autowired.register(className, stomp);
  }

  private static get() {
    return Autowired.get<StompServer>(className);
  }

  public static send(destination: string, body: string, headers: Record<string, string> = {}) {
    this.get()?.send(destination, body, headers);
  }

  public static subscribe(destination: string, callback: (frame: StompFrame) => void) {
    this.get()?.subscribe(destination, callback);
  }

  public static unsubscribe(destination: string) {
    this.get()?.unsubscribe(destination);
  }
}
