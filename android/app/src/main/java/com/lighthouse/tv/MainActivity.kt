package com.lighthouse.tv

import android.annotation.SuppressLint
import android.app.Activity
import android.os.Bundle
import android.view.View
import android.webkit.WebView

// Thin native shell: a single fullscreen WebView that runs the React dashboard
// bundled under assets/www. All app logic lives in the web layer.
class MainActivity : Activity() {

    private lateinit var webView: WebView

    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        webView = WebView(this).apply {
            // A web view paints white until the page has its first frame, so it
            // starts on the same colour as everything else in the launch: the
            // window behind it, the system splash and the boot screen in
            // index.html are all @color/night.
            setBackgroundColor(getColor(R.color.night))
            settings.javaScriptEnabled = true
            // Enables localStorage, which the dashboard uses for persistence.
            settings.domStorageEnabled = true
            // Honour the page's fixed <meta viewport width=1280> and scale it
            // to fill the TV panel instead of using the raw device width.
            settings.useWideViewPort = true
            settings.loadWithOverviewMode = true
            isFocusable = true
            isFocusableInTouchMode = true
        }
        setContentView(webView)

        webView.loadUrl("file:///android_asset/www/index.html")
        webView.requestFocus()
    }

    override fun onResume() {
        super.onResume()
        hideSystemBars()
    }

    override fun onWindowFocusChanged(hasFocus: Boolean) {
        super.onWindowFocusChanged(hasFocus)
        if (hasFocus) hideSystemBars()
    }

    // Immersive fullscreen: keep the status and navigation bars hidden.
    @Suppress("DEPRECATION")
    private fun hideSystemBars() {
        window.decorView.systemUiVisibility = (
            View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY
                or View.SYSTEM_UI_FLAG_FULLSCREEN
                or View.SYSTEM_UI_FLAG_HIDE_NAVIGATION
                or View.SYSTEM_UI_FLAG_LAYOUT_STABLE
                or View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN
                or View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION
            )
    }

    // Let the remote's BACK button walk web history before leaving the app.
    @Suppress("DEPRECATION")
    override fun onBackPressed() {
        if (webView.canGoBack()) webView.goBack() else super.onBackPressed()
    }
}
