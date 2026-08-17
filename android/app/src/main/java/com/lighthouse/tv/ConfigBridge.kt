package com.lighthouse.tv

import android.webkit.JavascriptInterface

const val CONFIG_BRIDGE_NAME = "LighthouseConfig"

// Tells the page where the API is and what to present to it.
//
// The values are baked into the APK at build time (see buildConfigField in
// app/build.gradle.kts) rather than typed into a settings screen: the only input
// device this app has is a D-pad, and entering a URL and a token with one is the
// worst version of this there is.
//
// Read-only and installed on the same web view as ChannelBridge — the page asks,
// the native side answers, and nothing crosses in the other direction.
class ConfigBridge {

    @JavascriptInterface
    fun apiBaseUrl(): String = BuildConfig.API_BASE_URL

    @JavascriptInterface
    fun deviceToken(): String = BuildConfig.DEVICE_TOKEN
}
