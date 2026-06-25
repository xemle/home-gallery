import { toAbsoluteUrl } from "../utils/toAbsoluteUrl";

export interface ServerEvent {
  type: string;
  id: string;
  date: string;
  action?: string;
}

export declare type ServerEventListener = (event: ServerEvent) => void;

export class EventStream {
  private eventSource: EventSource | null = null
  private reconnectTimeout: number = 1000
  private maxReconnectTimeout: number = 2 * 60 * 1000
  private closed: boolean = false

  constructor(private onEvent: ServerEventListener) {}

  /**
   * Start the event stream. If the connection is lost, it will try to reconnect automatically.
   */
  start() {
    this.closed = false;
    if (this.eventSource) {
      return; // Already started or closed
    }

    this.eventSource = new EventSource(toAbsoluteUrl('api/events/stream'));

    this.eventSource.addEventListener('open', () => {
      this.reconnectTimeout = 1000;
    });

    this.eventSource.addEventListener('message', (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'pong') {
          console.log(`Connected to server events`);
        }
        this.onEvent(data);
      } catch (e) {
        console.log(`Could not read Event: ${e}`);
      }
    });

    this.eventSource.addEventListener('error', event => {
      console.log(`EventSource error. Try to reconnect ${JSON.stringify(event)}`);
      this.stop()

      setTimeout(() => {
        if (!this.closed) {
          this.start();
        }
      }, this.reconnectTimeout);
      this.reconnectTimeout = Math.min(this.maxReconnectTimeout, this.reconnectTimeout * 2);
    });
  }

  /**
   * Stop the event stream. It will not try to reconnect anymore.
   * If you want to restart the stream, call start() again.
   * If you want to close the stream permanently, call close() instead.
   */
  stop() {
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }
  }

  /**
   * Close the event stream permanently. It will not try to reconnect anymore.
   * If you want to restart the stream, call start() again.
   */
  close() {
    this.closed = true;
    if (this.eventSource) {
      this.stop();
    }
  }
}
