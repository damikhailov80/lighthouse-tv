package com.lighthouse.tv

import android.app.Activity
import android.content.Intent
import android.os.Bundle
import android.view.View
import android.webkit.WebView

// Thin native shell: a single fullscreen WebView that runs the React dashboard
// bundled under assets/www. All app logic lives in the web layer.
class MainActivity : Activity() {

    private lateinit var webView: WebView

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        // The bridge goes on this web view and not on the screensaver's: the
        // dashboard is the screen that owns the list, so it is the one allowed
        // to say what the home screen offers.
        webView = appWebView(this, routeOf(intent), ChannelBridge(applicationContext))
        setContentView(webView)
        webView.requestFocus()
    }

    // A second card selected while the app is already running. launchMode is
    // singleTask, so this arrives instead of a new instance being stacked on
    // top of the old one — the page just navigates, the way it would if the
    // remote had done it.
    override fun onNewIntent(intent: Intent) {
        super.onNewIntent(intent)
        setIntent(intent)
        webView.loadUrl(APP_URL + routeOf(intent))
    }

    // Turns lighthouse://activity/<id> into the hash the web app already
    // understands. Anything else — the launcher icon, the screensaver, the
    // channel's own heading — opens the dashboard.
    private fun routeOf(intent: Intent?): String {
        val uri = intent?.takeIf { it.action == Intent.ACTION_VIEW }?.data ?: return ""
        if (uri.scheme != DEEP_LINK_SCHEME || uri.host != DEEP_LINK_HOST) return ""
        val id = uri.pathSegments.firstOrNull() ?: return ""
        return "#/activity/$id"
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
