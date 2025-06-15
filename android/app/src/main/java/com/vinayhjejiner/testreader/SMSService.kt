package com.vinayhjejiner.testreader

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.Service
import android.content.Intent
import android.os.Build
import android.os.IBinder
import android.util.Log

class SMSService : Service() {
    override fun onCreate() {
        super.onCreate()
        Log.d("SMSService", "SMSService started")

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                "sms_channel",
                "SMS Listener",
                NotificationManager.IMPORTANCE_LOW
            )
            val manager = getSystemService(NotificationManager::class.java)
            manager.createNotificationChannel(channel)

            val notification = Notification.Builder(this, "sms_channel")
                .setContentTitle("Listening for SMS")
                .setSmallIcon(android.R.drawable.ic_dialog_info)
                .build()

            startForeground(1, notification)
        }
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        Log.d("SMSService", "SMSService onStartCommand")
        // SMSReceiver is already registered via manifest
        return START_STICKY
    }

    override fun onBind(intent: Intent?): IBinder? = null
}
