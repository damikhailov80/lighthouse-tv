package com.lighthouse.tv

import android.annotation.SuppressLint
import android.content.Context
import android.webkit.WebView

// The single-page build shipped inside the APK.
const val APP_URL = "file:///android_asset/www/index.html"

// The web view both screens are built from: the dashboard activity and the
// screensaver. They differ only in the route they open and in whether they can
// write to the home-screen channel — the bundle, the settings and the storage
// are the same, since one app has one WebView data directory, which is why the
// screensaver can read the picks the dashboard wrote without any of it being
// mirrored to the native side.
@SuppressLint("SetJavaScriptEnabled")
fun appWebView(context: Context, route: String = "", bridge: ChannelBridge? = null): WebView =
    WebView(context).apply {
        // A web view paints white until the page has its first frame, so it
        // starts on the same colour as everything else in the launch: the
        // window behind it, the system splash and the boot screen in
        // index.html are all @color/night.
        setBackgroundColor(context.getColor(R.color.night))
        settings.javaScriptEnabled = true
        // Enables localStorage, which the dashboard uses for persistence.
        settings.domStorageEnabled = true
        // Honour the page's fixed <meta viewport width=1280> and scale it
        // to fill the TV panel instead of using the raw device width.
        settings.useWideViewPort = true
        settings.loadWithOverviewMode = true
        isFocusable = true
        isFocusableInTouchMode = true
        // Only the dashboard gets one. The screensaver is passed nothing, so
        // window.LighthouseChannel is simply undefined there and the page's
        // publish call goes nowhere — the same as it does in a browser.
        bridge?.let { addJavascriptInterface(it, CHANNEL_BRIDGE_NAME) }
        loadUrl(APP_URL + route)
    }
