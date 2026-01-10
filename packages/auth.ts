import { type StompFrame } from './frame.js';

export interface AuthProvider {
  authenticate: (frame: StompFrame) => Promise<boolean> | boolean;
}

export class SimpleAuthProvider implements AuthProvider {
  private readonly login: string;
  private readonly passcode: string;
  constructor(login?: string, passcode?: string) {
    this.login = login ?? 'anonymous';
    this.passcode = passcode ?? 'anonymous';
  }

  public authenticate(frame: StompFrame) {
    const { login } = frame.headers;
    const { passcode } = frame.headers;
    const success =
      Boolean(login) && Boolean(passcode) && login === this.login && passcode === this.passcode;
    return success;
  }
}
