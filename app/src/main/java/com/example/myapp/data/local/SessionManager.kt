package com.example.myapp.data.local

import android.content.Context
import android.content.SharedPreferences

class SessionManager(context: Context) {

    private val prefs: SharedPreferences =
        context.getSharedPreferences(PREF_NAME, Context.MODE_PRIVATE)

    companion object {
        private const val PREF_NAME  = "budgetify_session"
        private const val KEY_TOKEN  = "jwt_token"
        private const val KEY_USER_ID   = "user_id"
        private const val KEY_USER_NAME = "user_name"
        private const val KEY_USER_EMAIL = "user_email"
    }

    /** "Bearer <token>" formatında döner — header'a direkt eklenebilir */
    val bearerToken: String
        get() = "Bearer ${prefs.getString(KEY_TOKEN, "") ?: ""}"

    val token: String?
        get() = prefs.getString(KEY_TOKEN, null)

    val isLoggedIn: Boolean
        get() = !token.isNullOrBlank()

    val userName: String
        get() = prefs.getString(KEY_USER_NAME, "Kullanıcı") ?: "Kullanıcı"

    val userEmail: String
        get() = prefs.getString(KEY_USER_EMAIL, "") ?: ""

    val userId: String
        get() = prefs.getString(KEY_USER_ID, "") ?: ""

    fun saveSession(token: String, userId: String, name: String, email: String) {
        prefs.edit()
            .putString(KEY_TOKEN, token)
            .putString(KEY_USER_ID, userId)
            .putString(KEY_USER_NAME, name)
            .putString(KEY_USER_EMAIL, email)
            .apply()
    }

    fun clearSession() {
        prefs.edit().clear().apply()
    }
}
