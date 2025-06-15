package com.vinayhjejiner.testreader

import android.content.Context
import android.content.SharedPreferences
import com.facebook.react.bridge.*

class SMSModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {
    override fun getName(): String {
        return "SMSModule"
    }

    @ReactMethod
    fun getLatestSMS(promise: Promise) {
        val prefs: SharedPreferences = reactApplicationContext.getSharedPreferences("SMS_APP", Context.MODE_PRIVATE)
        val sms = prefs.getString("latest_sms", "")
        promise.resolve(sms)
    }
}
