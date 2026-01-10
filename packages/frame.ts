export enum StompCommand {
  PING = 'PING',
  CONNECT = 'CONNECT',
  CONNECTED = 'CONNECTED',
  SEND = 'SEND',
  SUBSCRIBE = 'SUBSCRIBE',
  UNSUBSCRIBE = 'UNSUBSCRIBE',
  ACK = 'ACK',
  NACK = 'NACK',
  BEGIN = 'BEGIN',
  COMMIT = 'COMMIT',
  ABORT = 'ABORT',
  DISCONNECT = 'DISCONNECT',
  MESSAGE = 'MESSAGE',
  RECEIPT = 'RECEIPT',
  ERROR = 'ERROR',
}

export const BYTE = {
  // LINEFEED byte (octet 10)
  LF: '\x0A',
  // NULL byte (octet 0)
  NULL: '\x00',
};

export class StompFrame {
  public readonly command: StompCommand;
  public readonly headers: Record<string, string> = {};
  public readonly body: string = '';

  constructor(command: StompCommand, headers: Record<string, string> = {}, body: string = '') {
    this.command = command;
    this.headers = headers;
    this.body = body;
  }

  // 序列化为STOMP协议字符串
  public serialize(): string {
    let output = `${this.command}${BYTE.LF}`;
    for (const [key, value] of Object.entries(this.headers)) {
      output += `${key}:${value}${BYTE.LF}`;
    }
    output += `${BYTE.LF}${this.body}${BYTE.NULL}`;
    return output;
  }

  // 解析原始数据为STOMP帧
  public static parse(data: Buffer): StompFrame {
    const frame = data.toString();
    if (frame === BYTE.LF) {
      return new StompFrame(StompCommand.PING);
    }
    const lines = frame.split(BYTE.LF);
    let command = '';
    const headers: Record<string, string> = {};
    let body = '';
    let inHeaderSection = true;
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (i === 0 && !line.endsWith(BYTE.NULL)) {
        // 首行为命令行
        command = line;
      } else if (!line || line === '') {
        inHeaderSection = false; // 开始进入 body
      } else if (inHeaderSection) {
        const [key, value] = line.split(':', 2);
        if (key !== undefined && value !== undefined) {
          headers[key.trim()] = value.trim();
        }
      } else {
        body += `${line}\n`; // 注意这里可能需要处理最后多出的一个换行
      }
      // 如果遇到 \0，则说明是最后一个字符
      if (line.includes(BYTE.NULL)) {
        break;
      }
    }
    body = body ? body.slice(0, -1).replace(/\x00/g, '') : ''; //处理body数据
    return new StompFrame(command as StompCommand, headers, body);
  }
}
