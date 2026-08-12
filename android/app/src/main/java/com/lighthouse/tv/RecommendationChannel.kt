package com.lighthouse.tv

import android.annotation.TargetApi
import android.content.ContentUris
import android.content.ContentValues
import android.content.Context
import android.content.Intent
import android.graphics.Bitmap
import android.graphics.Canvas
import android.media.tv.TvContract
import android.media.tv.TvContract.Channels
import android.media.tv.TvContract.PreviewPrograms
import android.net.Uri
import android.os.Build
import android.provider.BaseColumns

// One card in the home-screen channel, exactly as the web layer handed it over.
// Every decision about what to offer was taken there; this side only copies the
// fields into the TV provider.
data class ChannelCard(
    // The activity. Both the deep-link target and the key rows are matched on,
    // so a republish updates the card that is already on the home screen.
    val id: String,
    val title: String,
    val subtitle: String,
    // The web layer's image key, e.g. "board-games".
    val image: String?,
)

// Identifies our one row among the channels this package owns. Looked up rather
// than remembered, so a cleared cache cannot leave a second, orphaned channel
// on the home screen next to the first.
private const val CHANNEL_PROVIDER_ID = "recommended"

// Both edges of the square the channel logo is drawn into, in pixels.
private const val LOGO_PX = 320

private const val PREFS = "lighthouse.channel"
private const val KEY_BROWSABLE_ASKED = "browsable_asked"

// The Google TV home screen's channel row: a few activities it is time to do,
// put where they are seen without the app being opened at all. The dashboard
// decides what goes in it and republishes on every change (see
// src/services/channel.ts); this is only the provider end of that.
//
// Preview channels arrived in API 26 and the app runs from 24, so everything
// here is a no-op on older televisions — their home screen has no row to fill.
object RecommendationChannel {

    // Puts the cards on the home screen. Called from the web bridge, which
    // means: on launch, and after every change to an activity.
    fun sync(context: Context, cards: List<ChannelCard>) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return
        val channelId = ensureChannel(context) ?: return
        syncPrograms(context, channelId, cards)
        requestBrowsable(context, channelId)
    }

    // The channel itself, created once and then reused. Its logo is written at
    // the same time: it is a property of the row rather than of the cards in it,
    // and rewriting it on every publish would be a bitmap encoded for nothing.
    @TargetApi(Build.VERSION_CODES.O)
    private fun ensureChannel(context: Context): Long? {
        findChannel(context)?.let { return it }

        val values = ContentValues().apply {
            put(Channels.COLUMN_TYPE, Channels.TYPE_PREVIEW)
            put(Channels.COLUMN_DISPLAY_NAME, context.getString(R.string.channel_name))
            put(Channels.COLUMN_INTERNAL_PROVIDER_ID, CHANNEL_PROVIDER_ID)
            // Where the row's own heading leads, as opposed to its cards: the
            // dashboard, with nothing selected.
            put(Channels.COLUMN_APP_LINK_INTENT_URI, deepLink(null))
        }
        val uri = context.contentResolver.insert(Channels.CONTENT_URI, values) ?: return null
        val channelId = ContentUris.parseId(uri)
        writeLogo(context, channelId)
        return channelId
    }

    @TargetApi(Build.VERSION_CODES.O)
    private fun findChannel(context: Context): Long? {
        // The provider scopes this query to our own package, so the whole result
        // is ours and the match is on our provider id alone.
        val projection = arrayOf(BaseColumns._ID, Channels.COLUMN_INTERNAL_PROVIDER_ID)
        context.contentResolver.query(Channels.CONTENT_URI, projection, null, null, null)
            ?.use { cursor ->
                while (cursor.moveToNext()) {
                    if (cursor.getString(1) == CHANNEL_PROVIDER_ID) return cursor.getLong(0)
                }
            }
        return null
    }

    // The launcher icon rather than the bare mark: it already carries the cream
    // field the logo is meant to sit on, and the home screen has a dark one.
    @TargetApi(Build.VERSION_CODES.O)
    private fun writeLogo(context: Context, channelId: Long) {
        val logo = context.getDrawable(R.drawable.ic_launcher) ?: return
        val bitmap = Bitmap.createBitmap(LOGO_PX, LOGO_PX, Bitmap.Config.ARGB_8888)
        logo.setBounds(0, 0, LOGO_PX, LOGO_PX)
        logo.draw(Canvas(bitmap))
        context.contentResolver.openOutputStream(TvContract.buildChannelLogoUri(channelId))
            ?.use { bitmap.compress(Bitmap.CompressFormat.PNG, 100, it) }
    }

    // Matches the cards against the rows already in the channel and moves only
    // what changed. Deliberately not a wipe-and-reinsert: the channel is
    // republished every time an activity is marked done, and rebuilding it
    // wholesale would make the home-screen row blink and lose the place of
    // anyone standing in it at that moment.
    @TargetApi(Build.VERSION_CODES.O)
    private fun syncPrograms(context: Context, channelId: Long, cards: List<ChannelCard>) {
        val resolver = context.contentResolver
        val existing = existingPrograms(context, channelId)

        cards.forEachIndexed { index, card ->
            // Weights count down from the top so the launcher keeps the order
            // the dashboard dealt instead of one of its own.
            val weight = cards.size - index
            val rowId = existing[card.id]
            if (rowId == null) {
                resolver.insert(PreviewPrograms.CONTENT_URI, values(context, card, weight, channelId))
            } else {
                // Without the channel id: it is fixed when the row is inserted,
                // and offering it again on an update is rejected.
                resolver.update(
                    TvContract.buildPreviewProgramUri(rowId),
                    values(context, card, weight, null),
                    null,
                    null,
                )
            }
        }

        val offered = cards.map { it.id }.toSet()
        for ((activityId, rowId) in existing) {
            if (activityId !in offered) {
                resolver.delete(TvContract.buildPreviewProgramUri(rowId), null, null)
            }
        }
    }

    // The channel's rows, by the activity each one is about.
    @TargetApi(Build.VERSION_CODES.O)
    private fun existingPrograms(context: Context, channelId: Long): Map<String, Long> {
        val programs = mutableMapOf<String, Long>()
        val projection = arrayOf(BaseColumns._ID, PreviewPrograms.COLUMN_INTERNAL_PROVIDER_ID)
        context.contentResolver.query(
            TvContract.buildPreviewProgramsUriForChannel(channelId),
            projection,
            null,
            null,
            null,
        )?.use { cursor ->
            while (cursor.moveToNext()) {
                cursor.getString(1)?.let { programs[it] = cursor.getLong(0) }
            }
        }
        return programs
    }

    @TargetApi(Build.VERSION_CODES.O)
    private fun values(
        context: Context,
        card: ChannelCard,
        weight: Int,
        channelId: Long?,
    ): ContentValues = ContentValues().apply {
        channelId?.let { put(PreviewPrograms.COLUMN_CHANNEL_ID, it) }
        put(PreviewPrograms.COLUMN_TYPE, PreviewPrograms.TYPE_CLIP)
        put(PreviewPrograms.COLUMN_TITLE, card.title)
        put(PreviewPrograms.COLUMN_SHORT_DESCRIPTION, card.subtitle)
        put(PreviewPrograms.COLUMN_INTENT_URI, deepLink(card.id))
        put(PreviewPrograms.COLUMN_INTERNAL_PROVIDER_ID, card.id)
        put(PreviewPrograms.COLUMN_WEIGHT, weight)
        posterUri(context, card.image)?.let {
            put(PreviewPrograms.COLUMN_POSTER_ART_URI, it)
            put(PreviewPrograms.COLUMN_POSTER_ART_ASPECT_RATIO, PreviewPrograms.ASPECT_RATIO_16_9)
        }
    }

    // The illustration, from the APK's own resources. The launcher is another
    // process and cannot read the base64 the web bundle inlines, so sync-web.sh
    // copies the same files into res/drawable-nodpi as well.
    //
    // Looked up by name at run time rather than through R, so that a Gradle
    // build without a preceding sync-web.sh still compiles: a missing
    // illustration costs the card its picture and nothing else.
    private fun posterUri(context: Context, image: String?): String? {
        if (image == null) return null
        val name = "img_" + image.replace('-', '_')
        val resource = context.resources.getIdentifier(name, "drawable", context.packageName)
        if (resource == 0) return null
        return "android.resource://${context.packageName}/drawable/$name"
    }

    // Where a card leads, as an intent URI the launcher can parse. An implicit
    // VIEW intent rather than a component of ours, so the same link can be fired
    // from adb to test the route without going near the home screen.
    private fun deepLink(activityId: String?): String {
        val uri = if (activityId == null) "$DEEP_LINK_SCHEME://$DEEP_LINK_HOST" else {
            "$DEEP_LINK_SCHEME://$DEEP_LINK_HOST/${Uri.encode(activityId)}"
        }
        return Intent(Intent.ACTION_VIEW, Uri.parse(uri)).toUri(Intent.URI_INTENT_SCHEME)
    }

    // Asks the viewer, once, to let the row onto the home screen. The system
    // owns that decision and shows its own dialog; all we can do is raise it,
    // and a television that asks again on every launch is a television nobody
    // keeps the app on. Asked only after the channel has cards in it, so the
    // dialog is never about an empty row.
    @TargetApi(Build.VERSION_CODES.O)
    private fun requestBrowsable(context: Context, channelId: Long) {
        val prefs = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
        if (prefs.getBoolean(KEY_BROWSABLE_ASKED, false)) return
        prefs.edit().putBoolean(KEY_BROWSABLE_ASKED, true).apply()
        TvContract.requestChannelBrowsable(context, channelId)
    }
}
