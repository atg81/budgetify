package com.example.myapp.ui.main

import android.content.Intent
import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import androidx.fragment.app.Fragment
import androidx.lifecycle.lifecycleScope
import com.example.myapp.R
import com.example.myapp.data.local.SessionManager
import com.example.myapp.data.network.RetrofitClient
import com.example.myapp.databinding.FragmentDashboardBinding
import com.example.myapp.ui.settings.SettingsActivity
import kotlinx.coroutines.launch
import java.text.NumberFormat
import java.util.Locale

class DashboardFragment : Fragment() {

    private var _binding: FragmentDashboardBinding? = null
    private val binding get() = _binding!!

    private lateinit var sessionManager: SessionManager
    private lateinit var adapter: TransactionAdapter

    override fun onCreateView(
        inflater: LayoutInflater,
        container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View {
        _binding = FragmentDashboardBinding.inflate(inflater, container, false)
        return binding.root
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)
        sessionManager = SessionManager(requireContext())

        setupRecyclerView()
        setupClickListeners()
        loadDashboardData()
    }

    private fun setupRecyclerView() {
        adapter = TransactionAdapter(emptyList())
        binding.rvRecentItems.adapter = adapter
    }

    private fun setupClickListeners() {
        binding.btnQuickAdd.setOnClickListener {
            requireActivity().findViewById<View>(R.id.navigation_add_expense)?.performClick()
        }

        binding.btnSettings.setOnClickListener {
            val intent = Intent(requireContext(), SettingsActivity::class.java)
            startActivity(intent)
        }

        binding.fabScanReceipt.setOnClickListener {
            val intent = Intent(requireContext(), Class.forName("com.example.myapp.ui.receipt.ScanReceiptActivity"))
            startActivity(intent)
        }
    }

    private fun loadDashboardData() {
        loadSummary()
        loadRecentTransactions()
    }

    private fun loadSummary() {
        lifecycleScope.launch {
            try {
                val response = RetrofitClient.apiService.getSummary(
                    token = sessionManager.bearerToken
                )

                if (response.isSuccessful && response.body()?.success == true) {
                    val summaryMap = response.body()?.data ?: emptyMap()
                    // Önce TRY, yoksa ilk döviz
                    val summary = summaryMap["TRY"] ?: summaryMap.values.firstOrNull()

                    if (summary != null) {
                        val formatter = NumberFormat.getNumberInstance(Locale("tr", "TR")).apply {
                            minimumFractionDigits = 2
                            maximumFractionDigits = 2
                        }

                        val net = summary.net
                        binding.tvBudgetAmount.text = "₺${formatter.format(net)}"
                        binding.tvProgressText.text =
                            "Gelir: ₺${formatter.format(summary.income)}  •  Gider: ₺${formatter.format(summary.expense)}"

                        // Progress bar: gider / gelir oranı (max %100)
                        if (summary.income > 0) {
                            val ratio = ((summary.expense / summary.income) * 100).toInt().coerceIn(0, 100)
                            binding.progressBudget.progress = ratio
                        } else {
                            binding.progressBudget.progress = 0
                        }
                    } else {
                        showEmptyState()
                    }
                } else {
                    showEmptyState()
                }
            } catch (e: Exception) {
                showEmptyState()
            }
        }
    }

    private fun loadRecentTransactions() {
        lifecycleScope.launch {
            try {
                val response = RetrofitClient.apiService.getTransactions(
                    token  = sessionManager.bearerToken,
                    limit  = 5,
                    offset = 0
                )

                if (response.isSuccessful && response.body()?.success == true) {
                    val transactions = response.body()?.data ?: emptyList()

                    if (transactions.isEmpty()) {
                        showEmptyState()
                    } else {
                        binding.emptyState.visibility   = View.GONE
                        binding.sectionRecent.visibility = View.VISIBLE

                        adapter.updateData(transactions)
                    }
                } else {
                    showEmptyState()
                }
            } catch (e: Exception) {
                showEmptyState()
            }
        }
    }

    private fun showEmptyState() {
        if (_binding == null) return
        binding.emptyState.visibility    = View.VISIBLE
        binding.sectionRecent.visibility = View.GONE
    }

    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
    }
}
