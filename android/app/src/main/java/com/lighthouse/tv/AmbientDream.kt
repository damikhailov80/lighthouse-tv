package com.lighthouse.tv

import android.service.dreams.DreamService
import android.webkit.WebView

// The TV's screensaver. Android TV has no home-screen widgets, so this is where
// an idle screen can show what the day has to offer: the same web bundle opened
// on its ambient route, reading the same localStorage the dashboard writes.
//
// Enabled by the viewer in Settings → Device preferences → Screen saver.
class AmbientDream : DreamService() {

    private var webView: WebView? = null

    override fun onAttachedToWindow() {
        super.onAttachedToWindow()
        // No system bars over the picture, and any press on the remote wakes the
        // TV out of the dream instead of being delivered to the page — there is
        // nothing on this screen to press.
        isFullscreen = true
        isInteractive = false

        val web = appWebView(this, "#/ambient")
        webView = web
        setContentView(web)
    }

    override fun onDetachedFromWindow() {
        // The dream is built and torn down again on every idle period, so the
        // view has to go with it rather than be left behind each time.
        webView?.destroy()
        webView = null
        super.onDetachedFromWindow()
    }
}
