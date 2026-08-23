package com.mahallu.erp

import android.app.Application
import android.app.NotificationChannel
import android.app.NotificationManager
import android.content.Context
import android.content.res.Configuration
import android.media.AudioAttributes
import android.net.Uri
import android.os.Build

import com.facebook.react.PackageList
import com.facebook.react.ReactApplication
import com.facebook.react.ReactNativeApplicationEntryPoint.loadReactNative
import com.facebook.react.ReactNativeHost
import com.facebook.react.ReactPackage
import com.facebook.react.ReactHost
import com.facebook.react.common.ReleaseLevel
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint
import com.facebook.react.defaults.DefaultReactNativeHost

import expo.modules.ApplicationLifecycleDispatcher
import expo.modules.ReactNativeHostWrapper

class MainApplication : Application(), ReactApplication {

  override val reactNativeHost: ReactNativeHost = ReactNativeHostWrapper(
      this,
      object : DefaultReactNativeHost(this) {
        override fun getPackages(): List<ReactPackage> =
            PackageList(this).packages.apply {
              // Packages that cannot be autolinked yet can be added manually here, for example:
              // add(MyReactNativePackage())
            }

          override fun getJSMainModuleName(): String = ".expo/.virtual-metro-entry"

          override fun getUseDeveloperSupport(): Boolean = BuildConfig.DEBUG

          override val isNewArchEnabled: Boolean = BuildConfig.IS_NEW_ARCHITECTURE_ENABLED
      }
  )

  override val reactHost: ReactHost
    get() = ReactNativeHostWrapper.createReactHost(applicationContext, reactNativeHost)

  override fun onCreate() {
    super.onCreate()
    createPrayerNotificationChannels()
    DefaultNewArchitectureEntryPoint.releaseLevel = try {
      ReleaseLevel.valueOf(BuildConfig.REACT_NATIVE_RELEASE_LEVEL.uppercase())
    } catch (e: IllegalArgumentException) {
      ReleaseLevel.STABLE
    }
    loadReactNative(this)
    ApplicationLifecycleDispatcher.onApplicationCreate(this)
  }

  private fun createPrayerNotificationChannels() {
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
      val notificationManager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager

      // Adhan Voice Channel
      val adhanSoundUri = Uri.parse("android.resource://$packageName/raw/adhan")
      val audioAttributes = AudioAttributes.Builder()
          .setUsage(AudioAttributes.USAGE_ALARM)
          .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
          .build()

      val voiceChannel = NotificationChannel(
          "prayer-voice",
          "Adhan & Prayer Voice",
          NotificationManager.IMPORTANCE_HIGH
      ).apply {
        description = "Plays Adhan audio and alerts for daily prayer times"
        setSound(adhanSoundUri, audioAttributes)
        enableVibration(true)
        vibrationPattern = longArrayOf(0, 500, 250, 500)
        lockscreenVisibility = android.app.Notification.VISIBILITY_PUBLIC
        setBypassDnd(true)
      }
      notificationManager.createNotificationChannel(voiceChannel)

      // Silent Channel
      val silentChannel = NotificationChannel(
          "prayer-silent",
          "Silent Prayer Reminders",
          NotificationManager.IMPORTANCE_DEFAULT
      ).apply {
        description = "Silent reminders for prayer times"
        setSound(null, null)
        enableVibration(true)
      }
      notificationManager.createNotificationChannel(silentChannel)

      // Notices Channel
      val noticesChannel = NotificationChannel(
          "mahallu-notices",
          "Mahallu Notices & Events",
          NotificationManager.IMPORTANCE_HIGH
      ).apply {
        description = "Important Mahallu community announcements and events"
      }
      notificationManager.createNotificationChannel(noticesChannel)
    }
  }

  override fun onConfigurationChanged(newConfig: Configuration) {
    super.onConfigurationChanged(newConfig)
    ApplicationLifecycleDispatcher.onConfigurationChanged(this, newConfig)
  }
}
