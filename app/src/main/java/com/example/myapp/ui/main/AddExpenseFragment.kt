package com.example.myapp.ui.main

import android.app.DatePickerDialog
import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.ArrayAdapter
import androidx.fragment.app.Fragment
import androidx.lifecycle.lifecycleScope
import com.example.myapp.R
import com.example.myapp.data.local.SessionManager
import com.example.myapp.data.model.Category
import com.example.myapp.data.model.CreateTransactionRequest
import com.example.myapp.data.network.RetrofitClient
import com.example.myapp.databinding.FragmentAddExpenseBinding
import com.google.android.material.snackbar.Snackbar
import kotlinx.coroutines.launch
import java.text.SimpleDateFormat
import java.util.*

class AddExpenseFragment : Fragment() {

    private var _binding: FragmentAddExpenseBinding? = null
    private val binding get() = _binding!!

    private val calendar      = Calendar.getInstance()
    private val dateFormatter = SimpleDateFormat("dd MMMM yyyy", Locale("tr"))
    private val apiDateFormat = SimpleDateFormat("yyyy-MM-dd", Locale.US)

    private lateinit var sessionManager: SessionManager
    private var categories: List<Category> = emptyList()
    private var selectedType = "expense"   // varsayılan: gider

    override fun onCreateView(
        inflater: LayoutInflater,
        container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View {
        _binding = FragmentAddExpenseBinding.inflate(inflater, container, false)
        return binding.root
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)
        sessionManager = SessionManager(requireContext())

        setupTypeToggle()
        setupDatePicker()
        setupClickListeners()
        loadCategories()
    }

    private fun setupTypeToggle() {
        binding.toggleType.addOnButtonCheckedListener { _, checkedId, isChecked ->
            if (isChecked) {
                if (checkedId == binding.btnExpense.id) {
                    selectedType = "expense"
                    binding.tvTitle.text = "Harcama Ekle"
                } else if (checkedId == binding.btnIncome.id) {
                    selectedType = "income"
                    binding.tvTitle.text = "Gelir Ekle"
                }
            }
        }
    }

    private fun loadCategories() {
        lifecycleScope.launch {
            try {
                val response = RetrofitClient.apiService.getCategories(
                    token = sessionManager.bearerToken
                )

                if (response.isSuccessful && response.body()?.success == true) {
                    categories = response.body()?.data ?: emptyList()
                    setupCategorySpinner()
                } else {
                    setupFallbackSpinner()
                }
            } catch (e: Exception) {
                setupFallbackSpinner()
            }
        }
    }

    private fun setupCategorySpinner() {
        val displayNames = categories.map { cat ->
            "${cat.emoji ?: "📁"} ${cat.name}"
        }.toMutableList()
        displayNames.add(0, "Kategori Seçin")

        val adapter = ArrayAdapter(requireContext(), android.R.layout.simple_spinner_item, displayNames)
        adapter.setDropDownViewResource(android.R.layout.simple_spinner_dropdown_item)
        binding.spinnerCategory.adapter = adapter
    }

    private fun setupFallbackSpinner() {
        val fallback = arrayOf("Kategori Seçin", "🍔 Gıda", "🚌 Ulaşım",
            "🎮 Eğlence", "💡 Faturalar", "💊 Sağlık", "🛍️ Alışveriş", "📦 Diğer")
        val adapter = ArrayAdapter(requireContext(), android.R.layout.simple_spinner_item, fallback)
        adapter.setDropDownViewResource(android.R.layout.simple_spinner_dropdown_item)
        binding.spinnerCategory.adapter = adapter
    }

    private fun setupDatePicker() {
        updateDateDisplay()

        binding.cardDate.setOnClickListener {
            DatePickerDialog(
                requireContext(),
                { _, year, month, dayOfMonth ->
                    calendar.set(year, month, dayOfMonth)
                    updateDateDisplay()
                },
                calendar.get(Calendar.YEAR),
                calendar.get(Calendar.MONTH),
                calendar.get(Calendar.DAY_OF_MONTH)
            ).show()
        }
    }

    private fun updateDateDisplay() {
        val today = Calendar.getInstance()
        val dateText = if (isSameDay(calendar, today)) "Bugün"
        else dateFormatter.format(calendar.time)
        binding.tvDateValue.text = dateText
    }

    private fun isSameDay(cal1: Calendar, cal2: Calendar): Boolean =
        cal1.get(Calendar.YEAR) == cal2.get(Calendar.YEAR) &&
        cal1.get(Calendar.DAY_OF_YEAR) == cal2.get(Calendar.DAY_OF_YEAR)

    private fun setupClickListeners() {
        binding.btnBack.setOnClickListener {
            requireActivity().findViewById<View>(R.id.navigation_dashboard)?.performClick()
        }

        binding.btnSave.setOnClickListener {
            saveTransaction()
        }
    }

    private fun saveTransaction() {
        val amountText = binding.etAmount.text?.toString()?.trim() ?: ""
        if (amountText.isEmpty()) {
            binding.etAmount.error = "Tutar zorunludur"
            return
        }

        val amount = amountText.toDoubleOrNull()
        if (amount == null || amount <= 0) {
            binding.etAmount.error = "Geçerli bir tutar girin"
            return
        }

        // Seçili kategori indeksi (0 = "Kategori Seçin" placeholder)
        val spinnerPos = binding.spinnerCategory.selectedItemPosition
        val selectedCategory: Category? = if (spinnerPos > 0 && categories.isNotEmpty()) {
            categories.getOrNull(spinnerPos - 1)
        } else null

        val description = binding.etDescription.text?.toString()?.trim()
        val dateStr     = apiDateFormat.format(calendar.time)

        setLoading(true)

        lifecycleScope.launch {
            try {
                val request = CreateTransactionRequest(
                    amount      = amount,
                    type        = selectedType,
                    date        = dateStr,
                    categoryId  = selectedCategory?.id,
                    currency    = "TRY",
                    description = description?.ifEmpty { null }
                )

                val response = RetrofitClient.apiService.createTransaction(
                    token = sessionManager.bearerToken,
                    body  = request
                )

                if (response.isSuccessful && response.body()?.success == true) {
                    Snackbar.make(binding.root, "İşlem kaydedildi ✓", Snackbar.LENGTH_SHORT).show()
                    // Dashboard'a dön
                    requireActivity().runOnUiThread {
                        requireActivity().findViewById<View>(R.id.navigation_dashboard)?.performClick()
                    }
                } else {
                    Snackbar.make(binding.root, "Kayıt başarısız: ${response.code()}", Snackbar.LENGTH_LONG).show()
                }

            } catch (e: Exception) {
                Snackbar.make(binding.root, "Hata: ${e.message}", Snackbar.LENGTH_LONG).show()
            } finally {
                setLoading(false)
            }
        }
    }

    private fun setLoading(loading: Boolean) {
        binding.btnSave.isEnabled = !loading
        binding.btnSave.text = if (loading) "Kaydediliyor…" else "Kaydet"
    }

    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
    }
}
