package com.lighthouse.tv

import android.annotation.SuppressLint
import android.content.Context
import android.webkit.WebView

// The single-page build shipped inside the APK.
const val APP_URL = "file:///android_asset/www/index.html"

// The web view the app is built from. MainActivity is its only caller: the
// bundle, the settings and the storage all belong to the one screen there is.
@SuppressLint("SetJavaScriptEnabled")
fun appWebView(context: Context, route: String, bridge: ChannelBridge): WebView =
    WebView(context).apply {
        // A web view paints white until the page has its first frame, so it
        // starts on the same colour as everything else in the launch: the
        // window behind it, the system splash and the boot screen in
        // index.html are all @color/night.
        setBackgroundColor(context.getColor(R.color.night))
        settings.javaScriptEnabled = true
        // Enables localStorage, which the app uses to cache the last list it
        // was served so the first frame is not empty and a moment of bad Wi-Fi
        // does not blank the screen.
        settings.domStorageEnabled = true
        // Honour the page's fixed <meta viewport width=1280> and scale it
        // to fill the TV panel instead of using the raw device width.
        settings.useWideViewPort = true
        settings.loadWithOverviewMode = true
        isFocusable = true
        isFocusableInTouchMode = true
        addJavascriptInterface(bridge, CHANNEL_BRIDGE_NAME)
        addJavascriptInterface(ConfigBridge(), CONFIG_BRIDGE_NAME)
        loadUrl(APP_URL + route)
    }
