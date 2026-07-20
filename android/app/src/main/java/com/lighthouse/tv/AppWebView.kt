package com.lighthouse.tv

import android.annotation.SuppressLint
import android.content.Context
import android.webkit.WebView

// The single-page build shipped inside the APK.
private const val APP_URL = "file:///android_asset/www/index.html"

// The web view both screens are built from: the dashboard activity and the
// screensaver. They differ only in the route they open — the bundle, the
// settings and the storage are the same, since one app has one WebView data
// directory, which is why the screensaver can read the picks the dashboard
// wrote without any of it being mirrored to the native side.
@SuppressLint("SetJavaScriptEnabled")
fun appWebView(context: Context, route: String = ""): WebView =
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
        loadUrl(APP_URL + route)
    }
