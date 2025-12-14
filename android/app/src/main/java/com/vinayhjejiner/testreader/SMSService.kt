package com.vinayhjejiner.testreader

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.Service
import android.content.Context
import android.content.Intent
import android.os.Build
import android.os.IBinder
import android.util.Log
import org.json.JSONArray
import org.json.JSONObject
import java.text.SimpleDateFormat
import java.util.*

class SMSService : Service() {
    companion object {
        const val EXTRA_SMS_BODY = "extra_sms_body"
    }
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

        // If started with SMS content, process it
        val smsBody = intent?.getStringExtra(EXTRA_SMS_BODY)
        if (!smsBody.isNullOrEmpty()) {
            processSms(smsBody)
        }

        return START_STICKY
    }

    override fun onBind(intent: Intent?): IBinder? = null

    private fun processSms(smsBody: String) {
        Log.d("SMSService", "Processing SMS in service: $smsBody")

        // Save latest raw message for JS to pick up
        val prefs = getSharedPreferences("SMS_APP", Context.MODE_PRIVATE)
        prefs.edit().putString("latest_sms", smsBody).apply()

        // Simple parsing: find amounts and detect debit phrases
        val debitPhrases = listOf(
            "has been debited", "debited from", "debited with", "debited by",
            "amt debited", "amount debited", "sum debited", "debited amount",
            "was deducted", "has been deducted", "deducted from", "amount deducted",
            "you were debited", "you have been debited", "debited", "debit",
            "auto-debited", "auto debit", "payment of", "charged to"
        )

        val textLc = smsBody.toLowerCase(Locale.ROOT)
        val containsDebit = debitPhrases.any { textLc.contains(it) }

        if (!containsDebit) {
            Log.d("SMSService", "No debit phrase detected; skipping amount extraction")
            return
        }

        val amountRegex = Regex("(?:₹|INR|Rs\\.?)\\s*[-/]?\\s*([0-9]{1,3}(?:,[0-9]{3})*|[0-9]+)(?:\\.(\\d{1,2}))?", RegexOption.IGNORE_CASE)
        val matches = amountRegex.findAll(smsBody)
        val sdf = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss'Z'", Locale.US)
        sdf.timeZone = TimeZone.getTimeZone("UTC")

        if (matches.none()) {
            Log.d("SMSService", "No amounts found in SMS")
            return
        }

        val pendingJson = prefs.getString("pending_expenses", null)
        val pendingArray = if (pendingJson != null) JSONArray(pendingJson) else JSONArray()

        for (m in matches) {
            try {
                val intPart = m.groups[1]?.value ?: continue
                val decPart = m.groups[2]?.value ?: "00"
                val normalized = intPart.replace(",", "") + ".$decPart"
                val amount = normalized.toDoubleOrNull() ?: continue

                val obj = JSONObject()
                obj.put("amount", Math.round(amount * 100).toDouble() / 100.0)
                obj.put("originalMessage", smsBody)
                obj.put("timestamp", System.currentTimeMillis())
                obj.put("date", sdf.format(Date()))

                pendingArray.put(obj)
            } catch (e: Exception) {
                Log.e("SMSService", "Error parsing amount: ${e.message}")
            }
        }

        // Save updated pending list
        prefs.edit().putString("pending_expenses", pendingArray.toString()).apply()
        Log.d("SMSService", "Saved ${pendingArray.length()} pending expenses")
    }
}
