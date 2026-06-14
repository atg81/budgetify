package com.example.myapp.ui.auth

import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import androidx.fragment.app.Fragment
import androidx.lifecycle.lifecycleScope
import com.example.myapp.data.local.SessionManager
import com.example.myapp.data.model.LoginRequest
import com.example.myapp.data.network.RetrofitClient
import com.example.myapp.databinding.FragmentLoginBinding
import com.google.android.material.snackbar.Snackbar
import kotlinx.coroutines.launch

class LoginFragment : Fragment() {

    private var _binding: FragmentLoginBinding? = null
    private val binding get() = _binding!!

    private lateinit var sessionManager: SessionManager

    override fun onCreateView(
        inflater: LayoutInflater,
        container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View {
        _binding = FragmentLoginBinding.inflate(inflater, container, false)
        return binding.root
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)
        sessionManager = SessionManager(requireContext())
        setupClickListeners()
    }

    private fun setupClickListeners() {
        // Login butonu
        binding.btnLogin.setOnClickListener {
            val email    = binding.etEmail.text?.toString()?.trim() ?: ""
            val password = binding.etPassword.text?.toString() ?: ""

            if (!validateInputs(email, password)) return@setOnClickListener

            performLogin(email, password)
        }

        // Register butonuna tıklama
        binding.btnGoToRegister.setOnClickListener {
            (activity as? AuthActivity)?.showRegisterFragment()
        }

        // Şifremi unuttum
        binding.tvForgotPassword.setOnClickListener {
            showSnackbar("Şifre sıfırlama yakında eklenecek")
        }
    }

    private fun validateInputs(email: String, password: String): Boolean {
        if (email.isEmpty()) {
            binding.etEmail.error = "Email zorunludur"
            return false
        }
        if (!android.util.Patterns.EMAIL_ADDRESS.matcher(email).matches()) {
            binding.etEmail.error = "Geçerli bir email girin"
            return false
        }
        if (password.isEmpty()) {
            binding.etPassword.error = "Şifre zorunludur"
            return false
        }
        return true
    }

    private fun performLogin(email: String, password: String) {
        setLoading(true)

        lifecycleScope.launch {
            try {
                val response = RetrofitClient.apiService.login(
                    LoginRequest(email = email, password = password)
                )

                if (response.isSuccessful) {
                    val body = response.body()
                    if (body?.success == true && body.data != null) {
                        // Token ve kullanıcı bilgilerini kaydet
                        sessionManager.saveSession(
                            token  = body.data.token,
                            userId = body.data.user.id,
                            name   = body.data.user.name,
                            email  = body.data.user.email
                        )
                        (activity as? AuthActivity)?.navigateToMain()
                    } else {
                        showSnackbar(body?.message ?: "Giriş başarısız")
                    }
                } else {
                    val code = response.code()
                    showSnackbar(if (code == 401) "Email veya şifre hatalı" else "Hata: $code")
                }

            } catch (e: Exception) {
                showSnackbar("Sunucuya bağlanılamadı: ${e.message}")
            } finally {
                setLoading(false)
            }
        }
    }

    private fun setLoading(loading: Boolean) {
        binding.btnLogin.isEnabled = !loading
        binding.btnLogin.text = if (loading) "Giriş yapılıyor…" else "Giriş Yap"
    }

    private fun showSnackbar(msg: String) {
        Snackbar.make(binding.root, msg, Snackbar.LENGTH_LONG).show()
    }

    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
    }
}
