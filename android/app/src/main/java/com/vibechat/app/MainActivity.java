package com.vibechat.app;

import android.os.Bundle;
import android.webkit.WebSettings;
import android.webkit.WebView;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onStart() {
        super.onStart();
        if (this.bridge != null && this.bridge.getWebView() != null) {
            WebView webView = this.bridge.getWebView();
            webView.getSettings().setMixedContentMode(WebSettings.MIXED_CONTENT_ALWAYS_ALLOW);
            webView.getSettings().setDomStorageEnabled(true);
            webView.getSettings().setCacheMode(WebSettings.LOAD_DEFAULT);
            webView.clearCache(false);
        }
    }

    @Override
    public void onBackPressed() {
        if (this.bridge != null && this.bridge.getWebView() != null) {
            WebView webView = this.bridge.getWebView();
            webView.evaluateJavascript("window.__handleAppBack ? window.__handleAppBack() : false", value -> {
                // If JavaScript handled the back action (closed a chat or modal), do not exit the app
                if ("true".equalsIgnoreCase(value) || "\"true\"".equalsIgnoreCase(value)) {
                    return;
                }
                runOnUiThread(() -> MainActivity.super.onBackPressed());
            });
            return;
        }
        super.onBackPressed();
    }
}
