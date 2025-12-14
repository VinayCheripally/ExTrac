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

    @ReactMethod
    fun getPendingExpenses(promise: Promise) {
        try {
            val prefs: SharedPreferences = reactApplicationContext.getSharedPreferences("SMS_APP", Context.MODE_PRIVATE)
            val pendingJson = prefs.getString("pending_expenses", null)
            val array = Arguments.createArray()

            if (!pendingJson.isNullOrEmpty()) {
                val jsonArray = org.json.JSONArray(pendingJson)
                for (i in 0 until jsonArray.length()) {
                    val obj = jsonArray.getJSONObject(i)
                    val map = Arguments.createMap()
                    map.putDouble("amount", obj.optDouble("amount", 0.0))
                    map.putString("originalMessage", obj.optString("originalMessage", ""))
                    map.putDouble("timestamp", obj.optLong("timestamp", 0).toDouble())
                    map.putString("date", obj.optString("date", ""))
                    array.pushMap(map)
                }

                // Clear pending and latest raw SMS after reading to avoid duplicate processing
                prefs.edit().remove("pending_expenses").remove("latest_sms").apply()
            }

            promise.resolve(array)
        } catch (e: Exception) {
            promise.reject("ERR", e)
        }
    }
}
