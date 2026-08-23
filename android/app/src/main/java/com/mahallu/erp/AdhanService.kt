package com.mahallu.erp

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.content.Context
import android.content.Intent
import android.media.AudioAttributes
import android.media.AudioManager
import android.media.MediaPlayer
import android.net.Uri
import android.os.Build
import android.os.IBinder
import androidx.core.app.NotificationCompat

class AdhanService : Service() {
    private var mediaPlayer: MediaPlayer? = null

    companion object {
        const val CHANNEL_ID = "prayer-voice-full"
        const val NOTIFICATION_ID = 78601
        const val ACTION_STOP = "com.mahallu.erp.ACTION_STOP_ADHAN"
        const val EXTRA_PRAYER_NAME = "prayer_name"
    }

    override fun onBind(intent: Intent?): IBinder? = null

    override fun onCreate() {
        super.onCreate()
        createNotificationChannel()
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        if (intent?.action == ACTION_STOP) {
            stopAdhan()
            return START_NOT_STICKY
        }

        val prayerName = intent?.getStringExtra(EXTRA_PRAYER_NAME) ?: "Prayer"
        startForeground(NOTIFICATION_ID, buildAdhanNotification(prayerName))
        playFullAdhan()

        return START_NOT_STICKY
    }

    private fun playFullAdhan() {
        try {
            stopAdhanPlayer()

            mediaPlayer = MediaPlayer().apply {
                val soundUri = Uri.parse("android.resource://$packageName/raw/adhan")
                setDataSource(applicationContext, soundUri)
                
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
                    setAudioAttributes(
                        AudioAttributes.Builder()
                            .setUsage(AudioAttributes.USAGE_ALARM)
                            .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
                            .build()
                    )
                } else {
                    @Suppress("DEPRECATION")
                    setAudioStreamType(AudioManager.STREAM_ALARM)
                }

                setVolume(1.0f, 1.0f)
                prepare()
                start()

                setOnCompletionListener {
                    stopAdhan()
                }

                setOnErrorListener { _, _, _ ->
                    stopAdhan()
                    true
                }
            }
        } catch (e: Exception) {
            e.printStackTrace()
            stopAdhan()
        }
    }

    private fun buildAdhanNotification(prayerName: String): Notification {
        val stopIntent = Intent(this, AdhanService::class.java).apply {
            action = ACTION_STOP
        }
        val stopPendingIntent = PendingIntent.getService(
            this,
            0,
            stopIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or (if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) PendingIntent.FLAG_IMMUTABLE else 0)
        )

        val openAppIntent = packageManager.getLaunchIntentForPackage(packageName)
        val openAppPendingIntent = PendingIntent.getActivity(
            this,
            1,
            openAppIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or (if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) PendingIntent.FLAG_IMMUTABLE else 0)
        )

        return NotificationCompat.Builder(this, CHANNEL_ID)
            .setSmallIcon(R.drawable.notification_icon)
            .setContentTitle("🕌 $prayerName ബാങ്ക് സമയം (Adhan)")
            .setContentText("ബാങ്ക് മുഴങ്ങുന്നു... (Playing full Adhan)")
            .setPriority(NotificationCompat.PRIORITY_MAX)
            .setCategory(NotificationCompat.CATEGORY_ALARM)
            .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
            .setContentIntent(openAppPendingIntent)
            .setOngoing(true)
            .addAction(android.R.drawable.ic_media_pause, "STOP (നിർത്തുക)", stopPendingIntent)
            .build()
    }

    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                CHANNEL_ID,
                "Adhan Audio Playback",
                NotificationManager.IMPORTANCE_HIGH
            ).apply {
                description = "Plays full Adhan audio alarm"
                setSound(null, null) // Audio is managed by MediaPlayer
                enableVibration(true)
                lockscreenVisibility = Notification.VISIBILITY_PUBLIC
            }
            val manager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
            manager.createNotificationChannel(channel)
        }
    }

    private fun stopAdhanPlayer() {
        mediaPlayer?.let {
            if (it.isPlaying) {
                it.stop()
            }
            it.release()
        }
        mediaPlayer = null
    }

    private fun stopAdhan() {
        stopAdhanPlayer()
        stopForeground(true)
        stopSelf()
    }

    override fun onDestroy() {
        stopAdhanPlayer()
        super.onDestroy()
    }
}
