package com.lighthouse.tv

import android.content.Context
import android.util.Log
import android.webkit.JavascriptInterface
import org.json.JSONObject

// The name the web layer calls this object by. Must match
// src/services/channel.ts.
const val CHANNEL_BRIDGE_NAME = "LighthouseChannel"

// The one way anything crosses from the web layer to the native side: the
// dashboard hands over the cards it has decided on, and they go to the TV
// provider. Everything upstream of this — which activities, in what order, with
// what labels — stays in React, where the data lives.
//
// Installed on the dashboard's web view only. The screensaver's does not get
// one: it is read-only by design, and a television nobody is watching has no
// business rearranging the home screen.
class ChannelBridge(private val context: Context) {

    // Called from JavaScript, which means: on a WebView thread, never the UI
    // one — so the provider writes are already off the main thread.
    //
    // Nothing here may throw. It is reached from inside a page render, and the
    // home screen is a convenience on another screen entirely: a provider that
    // refuses a write should cost the channel an update, not take the dashboard
    // down with it.
    @JavascriptInterface
    fun publish(json: String) {
        try {
            val payload = JSONObject(json)
            val cards = payload.getJSONArray("cards")
            RecommendationChannel.sync(
                context,
                (0 until cards.length()).map { card(cards.getJSONObject(it)) },
            )
            // Null when the day has nothing left to suggest, which is the row
            // being emptied rather than left as it was.
            WatchNextRow.sync(
                context,
                if (payload.isNull("watchNext")) null else card(payload.getJSONObject("watchNext")),
            )
        } catch (error: Exception) {
            Log.w(TAG, "Could not publish to the home screen", error)
        }
    }

    private fun card(json: JSONObject) = ChannelCard(
        id = json.getString("id"),
        title = json.getString("title"),
        subtitle = json.getString("subtitle"),
        // Activities created before illustrations existed have no image.
        image = if (json.isNull("image")) null else json.getString("image"),
    )

    private companion object {
        const val TAG = "LighthouseChannel"
    }
}
