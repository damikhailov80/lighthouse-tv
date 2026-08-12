package com.lighthouse.tv

import android.annotation.TargetApi
import android.content.ContentValues
import android.content.Context
import android.media.tv.TvContract
import android.media.tv.TvContract.WatchNextPrograms
import android.os.Build
import android.provider.BaseColumns

// The system's own row — "Play Next" on Google TV, the one at the top that
// every app puts a single card in. Ours holds one of the day's suggestions.
//
// Deliberately one card and never more: this row belongs to the television, not
// to us, and an app that fills it with five of its own is an app that gets
// turned off. The five live in our own channel next door; this is the single
// thing worth putting in front of someone who has just switched the TV on.
//
// Preview and Watch Next programs both arrived in API 26, so like the channel
// this is a no-op on anything older.
object WatchNextRow {

    // Puts the day's one suggestion in the row, or takes ours out when there is
    // nothing to suggest — every suggestion already done today, or no
    // activities at all.
    fun sync(context: Context, card: ChannelCard?) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return

        val existing = existingRow(context)

        if (card == null) {
            existing?.let { remove(context, it.rowId) }
            return
        }

        if (existing == null) {
            insert(context, card)
            return
        }

        if (existing.activityId == card.id) {
            // The viewer swiped this card off the row. That is an answer, and
            // the contract is to leave it off rather than put it back on the
            // next publish. It holds only while the row still names this
            // activity — the moment the pick moves on, the refusal goes with it.
            if (!existing.browsable) return

            // The same activity, with something changed about it: a new due
            // label, a new title. Updated in place and without touching the
            // engagement time, so a card the viewer has already seen does not
            // jump back to the front of the row every time the app is opened.
            context.contentResolver.update(
                TvContract.buildWatchNextProgramUri(existing.rowId),
                values(context, card, engagedAt = null),
                null,
                null,
            )
            return
        }

        // A different activity. Replaced rather than updated, so it arrives with
        // its own engagement time and surfaces at the top of the row instead of
        // inheriting the place of the one before it — and so a card that was
        // swiped away is cleared out with it rather than sitting there,
        // invisible and refusing every pick that follows.
        remove(context, existing.rowId)
        insert(context, card)
    }

    // Our row, if we have one. The provider scopes the query to this package, so
    // anything it returns is ours; there is only ever one, because we only ever
    // insert one.
    @TargetApi(Build.VERSION_CODES.O)
    private fun existingRow(context: Context): Row? {
        val projection = arrayOf(
            BaseColumns._ID,
            WatchNextPrograms.COLUMN_INTERNAL_PROVIDER_ID,
            WatchNextPrograms.COLUMN_BROWSABLE,
        )
        context.contentResolver
            .query(WatchNextPrograms.CONTENT_URI, projection, null, null, null)
            ?.use { cursor ->
                if (cursor.moveToFirst()) {
                    return Row(
                        rowId = cursor.getLong(0),
                        activityId = cursor.getString(1),
                        browsable = cursor.getInt(2) == 1,
                    )
                }
            }
        return null
    }

    @TargetApi(Build.VERSION_CODES.O)
    private fun insert(context: Context, card: ChannelCard) {
        context.contentResolver.insert(
            WatchNextPrograms.CONTENT_URI,
            values(context, card, engagedAt = System.currentTimeMillis()),
        )
    }

    @TargetApi(Build.VERSION_CODES.O)
    private fun remove(context: Context, rowId: Long) {
        context.contentResolver.delete(TvContract.buildWatchNextProgramUri(rowId), null, null)
    }

    // `engagedAt` is left out on an update, which keeps whatever the row already
    // has.
    @TargetApi(Build.VERSION_CODES.O)
    private fun values(context: Context, card: ChannelCard, engagedAt: Long?): ContentValues =
        ContentValues().apply {
            // NEXT rather than CONTINUE: nothing here was left half-finished.
            // A recurring activity that has come round again is the next one in
            // a series, which is exactly what this row was built to carry.
            put(WatchNextPrograms.COLUMN_WATCH_NEXT_TYPE, WatchNextPrograms.WATCH_NEXT_TYPE_NEXT)
            put(WatchNextPrograms.COLUMN_TYPE, WatchNextPrograms.TYPE_CLIP)
            put(WatchNextPrograms.COLUMN_TITLE, card.title)
            put(WatchNextPrograms.COLUMN_SHORT_DESCRIPTION, card.subtitle)
            put(WatchNextPrograms.COLUMN_INTENT_URI, deepLink(card.id))
            put(WatchNextPrograms.COLUMN_INTERNAL_PROVIDER_ID, card.id)
            // Required for a NEXT card, and what the launcher sorts the row by:
            // when we put this in front of the viewer, not when they last did
            // the activity — a chore neglected for a month would otherwise be
            // filed at the far end of the row, which is the one place it must
            // not be.
            engagedAt?.let { put(WatchNextPrograms.COLUMN_LAST_ENGAGEMENT_TIME_UTC_MILLIS, it) }
            posterUri(context, card.image)?.let {
                put(WatchNextPrograms.COLUMN_POSTER_ART_URI, it)
                put(
                    WatchNextPrograms.COLUMN_POSTER_ART_ASPECT_RATIO,
                    WatchNextPrograms.ASPECT_RATIO_16_9,
                )
            }
        }

    private data class Row(val rowId: Long, val activityId: String?, val browsable: Boolean)
}
