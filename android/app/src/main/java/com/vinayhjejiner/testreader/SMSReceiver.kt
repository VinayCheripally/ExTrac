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

                // Forward SMS to the foreground service for processing (keep onReceive short)
                val serviceIntent = Intent(context, SMSService::class.java)
                serviceIntent.putExtra(SMSService.EXTRA_SMS_BODY, smsBody)
                if (context != null) {
                    if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.O) {
                        try {
                            context.startForegroundService(serviceIntent)
                        } catch (e: Exception) {
                            // Fallback
                            context.startService(serviceIntent)
                        }
                    } else {
                        context.startService(serviceIntent)
                    }
                }
            }
        }
    }
}
