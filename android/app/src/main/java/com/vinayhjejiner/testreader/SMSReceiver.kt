package com.vinayhjejiner.testreader

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.os.Bundle
import android.provider.Telephony
import android.util.Log
import java.util.*

class SMSReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context?, intent: Intent?) {
        if (Telephony.Sms.Intents.SMS_RECEIVED_ACTION == intent?.action) {
            val bundle: Bundle? = intent.extras
            if (bundle != null) {
                val messages = Telephony.Sms.Intents.getMessagesFromIntent(intent)
                val smsBody = messages.joinToString("") { it.messageBody }

                Log.d("SMSReceiver", "Received SMS: $smsBody")

                // Save SMS to shared preferences
                val prefs = context?.getSharedPreferences("SMS_APP", Context.MODE_PRIVATE)
                prefs?.edit()?.putString("latest_sms", smsBody)?.apply()
            }
        }
    }
}
