package com.lighthouse.tv

import android.content.Context
import android.content.Intent
import android.net.Uri

// The scheme the home screen's cards are addressed by. Kept in step with the
// intent filter in AndroidManifest.xml and with MainActivity, which parses them
// back into a route.
const val DEEP_LINK_SCHEME = "lighthouse"
const val DEEP_LINK_HOST = "activity"

// One card on the home screen, exactly as the web layer handed it over. Every
// decision about what to offer was taken there; this side only copies the
// fields into the TV provider.
//
// The same card serves both rows we write: our own channel of things it is time
// to do, and the system's Watch Next. They are laid out differently by the
// launcher but say the same thing about an activity.
data class ChannelCard(
    // The activity. Both the deep-link target and the key rows are matched on,
    // so a republish updates the card that is already on the home screen.
    val id: String,
    val title: String,
    val subtitle: String,
    // The web layer's image key, e.g. "board-games".
    val image: String?,
)

// The illustration, from the APK's own resources. The launcher is another
// process and cannot read the base64 the web bundle inlines, so sync-web.sh
// copies the same files into res/drawable-nodpi as well.
//
// Looked up by name at run time rather than through R, so that a Gradle build
// without a preceding sync-web.sh still compiles: a missing illustration costs
// the card its picture and nothing else.
fun posterUri(context: Context, image: String?): String? {
    if (image == null) return null
    val name = "img_" + image.replace('-', '_')
    val resource = context.resources.getIdentifier(name, "drawable", context.packageName)
    if (resource == 0) return null
    return "android.resource://${context.packageName}/drawable/$name"
}

// Where a card leads, as an intent URI the launcher can parse. An implicit VIEW
// intent rather than a component of ours, so the same link can be fired from adb
// to test the route without going near the home screen.
fun deepLink(activityId: String?): String {
    val uri = if (activityId == null) {
        "$DEEP_LINK_SCHEME://$DEEP_LINK_HOST"
    } else {
        "$DEEP_LINK_SCHEME://$DEEP_LINK_HOST/${Uri.encode(activityId)}"
    }
    return Intent(Intent.ACTION_VIEW, Uri.parse(uri)).toUri(Intent.URI_INTENT_SCHEME)
}
