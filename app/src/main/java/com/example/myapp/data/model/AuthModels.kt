package com.example.myapp.data.model

import com.google.gson.annotations.SerializedName

// ── Request ──────────────────────────────────────
data class LoginRequest(
    val email: String,
    val password: String
)

data class RegisterRequest(
    val name: String,
    val email: String,
    val password: String
)

// ── Response ─────────────────────────────────────
data class User(
    val id: String,
    val email: String,
    val name: String,
    @SerializedName("created_at") val createdAt: String
)

data class AuthData(
    val user: User,
    val token: String
)

data class AuthResponse(
    val success: Boolean,
    val message: String,
    val data: AuthData?
)

data class UserResponse(
    val success: Boolean,
    val data: User?
)
