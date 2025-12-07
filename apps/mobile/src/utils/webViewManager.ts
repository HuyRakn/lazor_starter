/**
 * Global WebView Manager for handling window.open() calls from @lazorkit/wallet
 * This allows us to show a WebView modal and handle postMessage communication
 */

type MessageListener = (message: any) => void;
type CloseListener = () => void;

class WebViewManager {
  private url: string | null = null;
  private visible: boolean = false;
  private messageListeners: Set<MessageListener> = new Set();
  private closeListeners: Set<CloseListener> = new Set();
  private mockWindow: any = null;

  // Callbacks to update React component
  private setVisibleCallback: ((visible: boolean) => void) | null = null;
  private setUrlCallback: ((url: string) => void) | null = null;

  registerCallbacks(setVisible: (visible: boolean) => void, setUrl: (url: string) => void) {
    this.setVisibleCallback = setVisible;
    this.setUrlCallback = setUrl;
  }

  open(url: string): any {
    console.log('🔄 WebViewManager.open called:', url);
    
    this.url = url;
    this.visible = true;
    
    // Update React component
    if (this.setVisibleCallback) {
      this.setVisibleCallback(true);
    }
    if (this.setUrlCallback) {
      this.setUrlCallback(url);
    }

    // Create mock window object
    const messageListeners = new Set<Function>();
    let isClosed = false;

    this.mockWindow = {
      closed: false,
      get closed() {
        return isClosed;
      },
      location: {
        href: url,
        origin: new URL(url).origin,
        protocol: new URL(url).protocol,
        host: new URL(url).host,
        hostname: new URL(url).hostname,
        port: new URL(url).port,
        pathname: new URL(url).pathname,
        search: new URL(url).search,
        hash: new URL(url).hash,
        assign: () => {},
        replace: () => {},
        reload: () => {},
      },
      close: () => {
        console.log('Mock window.close() called');
        isClosed = true;
        this.close();
      },
      postMessage: (message: any, targetOrigin: string) => {
        console.log('📤 Mock window.postMessage() called:', message);
        // This would send message to WebView
      },
      addEventListener: (event: string, handler: Function) => {
        if (event === 'message') {
          messageListeners.add(handler);
          this.messageListeners.add(handler as MessageListener);
          console.log('📥 Added message listener, total:', messageListeners.size);
        }
      },
      removeEventListener: (event: string, handler: Function) => {
        if (event === 'message') {
          messageListeners.delete(handler);
          this.messageListeners.delete(handler as MessageListener);
        }
      },
    };

    return this.mockWindow;
  }

  close() {
    console.log('🔒 WebViewManager.close called');
    this.visible = false;
    
    if (this.setVisibleCallback) {
      this.setVisibleCallback(false);
    }

    // Notify close listeners
    this.closeListeners.forEach((listener) => {
      try {
        listener();
      } catch (e) {
        console.error('Error in close listener:', e);
      }
    });
  }

  handleMessage(message: any) {
    console.log('📨 WebViewManager.handleMessage:', message);
    
    // Notify all message listeners
    this.messageListeners.forEach((listener) => {
      try {
        // Create a message event similar to what window.postMessage would create
        const messageEvent = {
          type: 'message',
          data: message.data || message,
          origin: message.origin || 'https://portal.lazor.sh',
          source: this.mockWindow,
        };
        listener(messageEvent);
      } catch (e) {
        console.error('Error in message listener:', e);
      }
    });
  }

  getUrl(): string | null {
    return this.url;
  }

  isVisible(): boolean {
    return this.visible;
  }
}

// Export singleton instance
export const webViewManager = new WebViewManager();

