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
                val sender = messages.firstOrNull()?.originatingAddress ?: "Unknown"

                Log.d("SMSReceiver", "Received SMS from $sender: $smsBody")

                // Save SMS to shared preferences
                val prefs = context?.getSharedPreferences("SMS_APP", Context.MODE_PRIVATE)
                prefs?.edit()?.putString("latest_sms", smsBody)?.apply()

                // Check if it's a financial SMS (basic check for common keywords)
                val financialKeywords = listOf(
                    "debited", "debit", "charged", "payment", "transaction", 
                    "₹", "rs", "inr", "amount", "balance", "account"
                )
                
                val isFinancialSMS = financialKeywords.any { keyword ->
                    smsBody.lowercase().contains(keyword)
                }

                if (isFinancialSMS) {
                    Log.d("SMSReceiver", "Financial SMS detected, notifying app")
                    
                    // Store the SMS with timestamp for the app to process
                    val timestamp = System.currentTimeMillis()
                    prefs?.edit()?.putString("pending_sms_$timestamp", smsBody)?.apply()
                    prefs?.edit()?.putLong("latest_sms_timestamp", timestamp)?.apply()
                }
            }
        }
    }
}