import React, { useRef, useEffect } from 'react';
import { Modal, View, StyleSheet, TouchableOpacity, Text, SafeAreaView } from 'react-native';
import { WebView } from 'react-native-webview';

type PortalWebViewProps = {
  visible: boolean;
  url: string;
  onMessage: (message: any) => void;
  onClose: () => void;
};

export function PortalWebView({ visible, url, onMessage, onClose }: PortalWebViewProps) {
  const webViewRef = useRef<WebView>(null);

  // Script to inject into WebView to handle postMessage and WebAuthn
  const injectedJavaScript = `
    (function() {
      // Override window.postMessage to send messages to React Native
      const originalPostMessage = window.postMessage;
      window.postMessage = function(message, targetOrigin) {
        console.log('📤 window.postMessage called:', message, targetOrigin);
        // Send to React Native
        if (window.ReactNativeWebView) {
          window.ReactNativeWebView.postMessage(JSON.stringify({
            type: 'message',
            data: message,
            origin: window.location.origin
          }));
        }
        // Also call original if needed
        if (originalPostMessage && typeof originalPostMessage === 'function') {
          try {
            originalPostMessage.call(window, message, targetOrigin);
          } catch (e) {
            console.warn('Error calling original postMessage:', e);
          }
        }
      };

      // Listen for messages from parent (if any)
      window.addEventListener('message', function(event) {
        console.log('📥 window message event:', event.data);
        if (window.ReactNativeWebView) {
          window.ReactNativeWebView.postMessage(JSON.stringify({
            type: 'message',
            data: event.data,
            origin: event.origin
          }));
        }
      });

      // Also listen for messages sent via window.opener.postMessage (for popup communication)
      if (window.opener) {
        window.addEventListener('message', function(event) {
          console.log('📥 Message from opener:', event.data);
          if (window.ReactNativeWebView) {
            window.ReactNativeWebView.postMessage(JSON.stringify({
              type: 'message',
              data: event.data,
              origin: event.origin
            }));
          }
        });
      }

      // Try to enable WebAuthn in WebView (may not work on all platforms)
      // Note: WebAuthn in WebView is limited, but we try to make it work
      if (navigator.credentials) {
        const originalCreate = navigator.credentials.create;
        const originalGet = navigator.credentials.get;
        
        // Wrap credentials.create to handle errors gracefully
        navigator.credentials.create = function(options) {
          console.log('🔐 navigator.credentials.create called:', options);
          try {
            return originalCreate.call(navigator.credentials, options);
          } catch (e) {
            console.error('WebAuthn create error:', e);
            // Send error to React Native
            if (window.ReactNativeWebView) {
              window.ReactNativeWebView.postMessage(JSON.stringify({
                type: 'webauthn_error',
                error: e.message,
                method: 'create'
              }));
            }
            throw e;
          }
        };
        
        // Wrap credentials.get to handle errors gracefully
        navigator.credentials.get = function(options) {
          console.log('🔐 navigator.credentials.get called:', options);
          try {
            return originalGet.call(navigator.credentials, options);
          } catch (e) {
            console.error('WebAuthn get error:', e);
            // Send error to React Native
            if (window.ReactNativeWebView) {
              window.ReactNativeWebView.postMessage(JSON.stringify({
                type: 'webauthn_error',
                error: e.message,
                method: 'get'
              }));
            }
            throw e;
          }
        };
      }

      console.log('✅ Portal WebView script injected');
    })();
    true; // Required for injected JavaScript
  `;

  const handleMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      console.log('📨 Received message from WebView:', data);
      onMessage(data);
    } catch (e) {
      console.error('Failed to parse WebView message:', e);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Connect Wallet</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
        </View>
        <WebView
          ref={webViewRef}
          source={{ uri: url }}
          onMessage={handleMessage}
          style={styles.webview}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          startInLoadingState={true}
          injectedJavaScript={injectedJavaScript}
          // Enable WebAuthn support
          allowsInlineMediaPlayback={true}
          mediaPlaybackRequiresUserAction={false}
          // iOS specific
          allowsBackForwardNavigationGestures={true}
          // Android specific
          androidLayerType="hardware"
          androidHardwareAccelerationDisabled={false}
          // Enable third-party cookies for portal
          thirdPartyCookiesEnabled={true}
          sharedCookiesEnabled={true}
          onLoadEnd={() => {
            // Re-inject script after page loads to ensure it's active
            console.log('📄 WebView page loaded, re-injecting script');
            webViewRef.current?.injectJavaScript(injectedJavaScript);
          }}
          onLoadStart={() => {
            console.log('🔄 WebView started loading:', url);
          }}
          onShouldStartLoadWithRequest={(request) => {
            // Allow all navigation
            console.log('🔗 WebView navigation request:', request.url);
            return true;
          }}
          onError={(syntheticEvent) => {
            const { nativeEvent } = syntheticEvent;
            console.error('WebView error:', nativeEvent);
          }}
          onHttpError={(syntheticEvent) => {
            const { nativeEvent } = syntheticEvent;
            console.error('WebView HTTP error:', nativeEvent);
          }}
        />
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#000000',
    borderBottomWidth: 1,
    borderBottomColor: '#333333',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#333333',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  webview: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
});

