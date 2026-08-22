package com.mahallu.erp

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.os.Build

class AdhanAlarmReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context?, intent: Intent?) {
        if (context == null) return

        val prayerName = intent?.getStringExtra(AdhanService.EXTRA_PRAYER_NAME) ?: "Prayer"
        val serviceIntent = Intent(context, AdhanService::class.java).apply {
            putExtra(AdhanService.EXTRA_PRAYER_NAME, prayerName)
        }

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            context.startForegroundService(serviceIntent)
        } else {
            context.startService(serviceIntent)
        }
    }
}
