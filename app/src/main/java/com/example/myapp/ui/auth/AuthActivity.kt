package com.example.myapp.ui.auth

import android.content.Intent
import android.os.Bundle
import androidx.appcompat.app.AppCompatActivity
import androidx.appcompat.app.AppCompatDelegate
import androidx.fragment.app.Fragment
import com.example.myapp.MainActivity
import com.example.myapp.R
import com.example.myapp.data.local.SessionManager
import com.example.myapp.databinding.ActivityAuthBinding

class AuthActivity : AppCompatActivity() {

    private lateinit var binding: ActivityAuthBinding
    private lateinit var sessionManager: SessionManager

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        // Force dark theme
        AppCompatDelegate.setDefaultNightMode(AppCompatDelegate.MODE_NIGHT_YES)

        sessionManager = SessionManager(this)

        // Zaten giriş yapılmışsa direkt ana ekrana git
        if (sessionManager.isLoggedIn) {
            navigateToMain()
            return
        }

        binding = ActivityAuthBinding.inflate(layoutInflater)
        setContentView(binding.root)

        // İlk fragment olarak LoginFragment göster
        if (savedInstanceState == null) {
            showLoginFragment()
        }
    }

    fun showLoginFragment() {
        replaceFragment(LoginFragment(), isForward = false)
    }

    fun showRegisterFragment() {
        replaceFragment(RegisterFragment(), isForward = true)
    }

    fun navigateToMain() {
        val intent = Intent(this, MainActivity::class.java)
        startActivity(intent)
        finish() // AuthActivity'yi stack'ten kaldır
    }

    private fun replaceFragment(fragment: Fragment, isForward: Boolean) {
        val transaction = supportFragmentManager.beginTransaction()

        // Animasyonları ekle
        if (isForward) {
            transaction.setCustomAnimations(
                    R.anim.slide_in_right, // enter
                    R.anim.slide_out_left, // exit
                    R.anim.slide_in_left, // popEnter
                    R.anim.slide_out_right // popExit
            )
        }

        transaction.replace(R.id.auth_fragment_container, fragment)
        transaction.commit()
    }
}
