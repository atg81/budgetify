package com.example.myapp.ui.auth

import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import androidx.fragment.app.Fragment
import androidx.lifecycle.lifecycleScope
import com.example.myapp.data.local.SessionManager
import com.example.myapp.data.model.RegisterRequest
import com.example.myapp.data.network.RetrofitClient
import com.example.myapp.databinding.FragmentRegisterBinding
import com.google.android.material.snackbar.Snackbar
import kotlinx.coroutines.launch

class RegisterFragment : Fragment() {

    private var _binding: FragmentRegisterBinding? = null
    private val binding get() = _binding!!

    private lateinit var sessionManager: SessionManager

    override fun onCreateView(
        inflater: LayoutInflater,
        container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View {
        _binding = FragmentRegisterBinding.inflate(inflater, container, false)
        return binding.root
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)
        sessionManager = SessionManager(requireContext())
        setupClickListeners()
    }

    private fun setupClickListeners() {
        // Geri butonu
        binding.btnBack.setOnClickListener {
            (activity as? AuthActivity)?.showLoginFragment()
        }

        // Register butonu
        binding.btnRegister.setOnClickListener {
            val name     = binding.etName.text?.toString()?.trim() ?: ""
            val email    = binding.etEmail.text?.toString()?.trim() ?: ""
            val password = binding.etPassword.text?.toString() ?: ""

            if (!validateInputs(name, email, password)) return@setOnClickListener

            performRegister(name, email, password)
        }

        // Giriş yap linki
        binding.btnGoToLogin.setOnClickListener {
            (activity as? AuthActivity)?.showLoginFragment()
        }
    }

    private fun validateInputs(name: String, email: String, password: String): Boolean {
        if (name.isEmpty()) {
            binding.tilName.error = "Ad zorunludur"
            return false
        }
        binding.tilName.error = null
        if (email.isEmpty()) {
            binding.etEmail.error = "Email zorunludur"
            return false
        }
        if (!android.util.Patterns.EMAIL_ADDRESS.matcher(email).matches()) {
            binding.etEmail.error = "Geçerli bir email girin"
            return false
        }
        if (password.length < 6) {
            binding.etPassword.error = "Şifre en az 6 karakter olmalı"
            return false
        }
        return true
    }

    private fun performRegister(name: String, email: String, password: String) {
        setLoading(true)

        lifecycleScope.launch {
            try {
                val response = RetrofitClient.apiService.register(
                    RegisterRequest(name = name, email = email, password = password)
                )

                if (response.isSuccessful) {
                    val body = response.body()
                    if (body?.success == true && body.data != null) {
                        sessionManager.saveSession(
                            token  = body.data.token,
                            userId = body.data.user.id,
                            name   = body.data.user.name,
                            email  = body.data.user.email
                        )
                        (activity as? AuthActivity)?.navigateToMain()
                    } else {
                        showSnackbar(body?.message ?: "Kayıt başarısız")
                    }
                } else {
                    val code = response.code()
                    showSnackbar(if (code == 409) "Bu email zaten kayıtlı" else "Hata: $code")
                }

            } catch (e: Exception) {
                showSnackbar("Sunucuya bağlanılamadı: ${e.message}")
            } finally {
                setLoading(false)
            }
        }
    }

    private fun setLoading(loading: Boolean) {
        binding.btnRegister.isEnabled = !loading
        binding.btnRegister.text = if (loading) "Kayıt yapılıyor…" else "Kayıt Ol"
    }

    private fun showSnackbar(msg: String) {
        Snackbar.make(binding.root, msg, Snackbar.LENGTH_LONG).show()
    }

    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
    }
}
