package com.lighthouse.tv

import android.content.Intent
import android.service.dreams.DreamService
import android.view.KeyEvent
import android.view.MotionEvent
import android.webkit.WebView

// The buttons that mean "yes" on a remote. OK on the screensaver opens the app
// on the activity it is showing; everything else just leaves.
private val OPEN_KEYS = setOf(
    KeyEvent.KEYCODE_DPAD_CENTER,
    KeyEvent.KEYCODE_ENTER,
    KeyEvent.KEYCODE_NUMPAD_ENTER,
    KeyEvent.KEYCODE_BUTTON_A,
)

// The TV's screensaver. Android TV has no home-screen widgets, so this is where
// an idle screen can show what the day has to offer: the same web bundle opened
// on its ambient route, reading the same localStorage the dashboard writes.
//
// Enabled by the viewer in Settings → Device preferences → Screen saver.
class AmbientDream : DreamService() {

    private var webView: WebView? = null

    override fun onAttachedToWindow() {
        super.onAttachedToWindow()
        // No system bars over the picture.
        isFullscreen = true
        // Interactive only so that OK can be told apart from every other button:
        // a non-interactive dream is dismissed by the system before it ever sees
        // the press. The page itself stays untouchable — every event is handled
        // here and none is passed down to it.
        isInteractive = true

        val web = appWebView(this, "#/ambient")
        webView = web
        setContentView(web)
    }

    // The whole remote, handled in one place, so the screensaver keeps the one
    // behaviour viewers expect of it — any button gets you out — while OK gets
    // you out *into the app*. Acted on the release, and always consumed, so a
    // press can never reach the page underneath.
    override fun dispatchKeyEvent(event: KeyEvent): Boolean {
        if (event.action == KeyEvent.ACTION_UP) {
            if (event.keyCode in OPEN_KEYS) openApp() else wakeUp()
        }
        return true
    }

    // TVs have no touchscreen, but the same shell runs on phones and tablets,
    // where a tap is the same "yes" as OK.
    override fun dispatchTouchEvent(event: MotionEvent): Boolean {
        if (event.action == MotionEvent.ACTION_UP) openApp()
        return true
    }

    private fun openApp() {
        // The dream is not an activity and has no task of its own, so the app
        // has to be started into one.
        startActivity(
            Intent(this, MainActivity::class.java)
                .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP),
        )
        finish()
    }

    override fun onDetachedFromWindow() {
        // The dream is built and torn down again on every idle period, so the
        // view has to go with it rather than be left behind each time.
        webView?.destroy()
        webView = null
        super.onDetachedFromWindow()
    }
}
