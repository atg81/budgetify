package com.example.myapp.ui.settings

import android.os.Bundle
import androidx.appcompat.app.AppCompatActivity
import androidx.appcompat.app.AppCompatDelegate
import com.example.myapp.data.local.SessionManager
import com.example.myapp.databinding.ActivitySettingsBinding

class SettingsActivity : AppCompatActivity() {

    private lateinit var binding: ActivitySettingsBinding
    private lateinit var sessionManager: SessionManager

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        // Force dark theme
        AppCompatDelegate.setDefaultNightMode(AppCompatDelegate.MODE_NIGHT_YES)

        binding = ActivitySettingsBinding.inflate(layoutInflater)
        setContentView(binding.root)

        sessionManager = SessionManager(this)

        setupUI()
        setupClickListeners()
    }

    private fun setupUI() {
        val userName = sessionManager.userName
        val userEmail = sessionManager.userEmail
        
        binding.tvProfileLabel.text = if (userName.isNotEmpty()) userName else "Profil"
        binding.tvUserEmail.text = if (userEmail.isNotEmpty()) userEmail else "Bilgiler alınamadı"
    }

    private fun setupClickListeners() {
        // Geri butonu
        binding.btnBack.setOnClickListener { finish() }

        // Çıkış yap kartı
        binding.cardLogout.setOnClickListener {
            sessionManager.clearSession()
            val intent = android.content.Intent(this, com.example.myapp.ui.auth.AuthActivity::class.java)
            intent.flags = android.content.Intent.FLAG_ACTIVITY_NEW_TASK or android.content.Intent.FLAG_ACTIVITY_CLEAR_TASK
            startActivity(intent)
            finish()
        }
    }
}
