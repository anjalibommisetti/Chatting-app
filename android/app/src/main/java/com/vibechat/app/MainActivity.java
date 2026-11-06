package com.vibechat.app;

import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;
import android.webkit.DownloadListener;
import android.webkit.WebSettings;
import android.webkit.WebView;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    public static final String LIVE_SERVER_URL = "https://chatting-app-tan.vercel.app";

    @Override
    public void onStart() {
        super.onStart();
        if (this.bridge != null && this.bridge.getWebView() != null) {
            WebView webView = this.bridge.getWebView();
            WebSettings settings = webView.getSettings();
            settings.setJavaScriptEnabled(true);
            settings.setDomStorageEnabled(true);
            settings.setDatabaseEnabled(true);
            settings.setMixedContentMode(WebSettings.MIXED_CONTENT_ALWAYS_ALLOW);
            settings.setCacheMode(WebSettings.LOAD_DEFAULT);

            // Enable Native APK & File Downloads inside WebView
            webView.setDownloadListener(new DownloadListener() {
                @Override
                public void onDownloadStart(String url, String userAgent, String contentDisposition, String mimetype, long contentLength) {
                    try {
                        Intent intent = new Intent(Intent.ACTION_VIEW);
                        intent.setData(Uri.parse(url));
                        startActivity(intent);
                    } catch (Exception e) {
                        e.printStackTrace();
                    }
                }
            });

            // True Over-The-Air (OTA) Live Web Sync:
            // Ensure WebView connects directly to the live server URL for immediate updates
            String currentUrl = webView.getUrl();
            if (currentUrl == null || currentUrl.startsWith("http://localhost") || currentUrl.startsWith("capacitor://") || currentUrl.startsWith("file://")) {
                webView.loadUrl(LIVE_SERVER_URL);
            }
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
