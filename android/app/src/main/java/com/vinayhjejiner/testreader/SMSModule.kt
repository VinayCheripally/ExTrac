package com.vinayhjejiner.testreader

import android.content.Context
import android.content.SharedPreferences
import com.facebook.react.bridge.*
import com.facebook.react.modules.core.DeviceEventManagerModule

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

    @ReactMethod
    fun clearLatestSMS() {
        val prefs: SharedPreferences = reactApplicationContext.getSharedPreferences("SMS_APP", Context.MODE_PRIVATE)
        prefs.edit().remove("latest_sms").apply()
    }

    fun sendSMSEvent(smsContent: String) {
        reactApplicationContext
            .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
            .emit("onSMSReceived", smsContent)
    }
}