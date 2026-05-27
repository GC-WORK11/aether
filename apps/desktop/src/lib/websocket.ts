// WebSocket placeholder - implement MessagePack WS later
export class AetherWS {
  private ws: WebSocket | null = null
  private url: string

  constructor(url: string = 'ws://localhost:8000/ws') {
    this.url = url
  }

  connect() {
    this.ws = new WebSocket(this.url)
    return this.ws
  }

  disconnect() {
    this.ws?.close()
  }

  send(data: any) {
    this.ws?.send(JSON.stringify(data))
  }

  onMessage(handler: (data: any) => void) {
    if (this.ws) {
      this.ws.onmessage = (e) => handler(JSON.parse(e.data))
    }
  }
}
