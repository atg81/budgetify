package com.example.myapp.ui.main

import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import androidx.fragment.app.Fragment
import androidx.lifecycle.lifecycleScope
import androidx.recyclerview.widget.LinearLayoutManager
import com.example.myapp.data.local.SessionManager
import com.example.myapp.data.network.RetrofitClient
import com.example.myapp.databinding.FragmentHistoryBinding
import kotlinx.coroutines.launch

class HistoryFragment : Fragment() {

    private var _binding: FragmentHistoryBinding? = null
    private val binding get() = _binding!!

    private lateinit var sessionManager: SessionManager
    private lateinit var adapter: TransactionAdapter
    private var allTransactions: List<com.example.myapp.data.model.Transaction> = emptyList()

    override fun onCreateView(
            inflater: LayoutInflater,
            container: ViewGroup?,
            savedInstanceState: Bundle?
    ): View {
        _binding = FragmentHistoryBinding.inflate(inflater, container, false)
        return binding.root
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)
        sessionManager = SessionManager(requireContext())
        
        setupRecyclerView()
        setupFilterChips()
        loadHistory()
    }

    private fun setupRecyclerView() {
        adapter = TransactionAdapter(emptyList())
        binding.rvTransactions.layoutManager = LinearLayoutManager(context)
        binding.rvTransactions.adapter = adapter
    }

    private fun loadHistory() {
        lifecycleScope.launch {
            try {
                val response = RetrofitClient.apiService.getTransactions(sessionManager.bearerToken)
                if (response.isSuccessful && response.body()?.success == true) {
                    allTransactions = response.body()?.data ?: emptyList()
                    if (allTransactions.isEmpty()) {
                        showEmptyState()
                    } else {
                        showData(allTransactions)
                        applyFilter()
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
        binding.emptyState.visibility = View.VISIBLE
        binding.rvTransactions.visibility = View.GONE
    }

    private fun showData(transactions: List<com.example.myapp.data.model.Transaction>) {
        binding.emptyState.visibility = View.GONE
        binding.rvTransactions.visibility = View.VISIBLE
        adapter.updateData(transactions)
    }

    private fun setupFilterChips() {
        binding.chipGroupFilter.setOnCheckedStateChangeListener { _, _ ->
            applyFilter()
        }
    }

    private fun applyFilter() {
        if (allTransactions.isEmpty()) return

        val checkedId = binding.chipGroupFilter.checkedChipId
        val filtered = when (checkedId) {
            binding.chipIncome.id -> allTransactions.filter { it.type == "income" }
            binding.chipExpense.id -> allTransactions.filter { it.type == "expense" }
            else -> allTransactions
        }

        if (filtered.isEmpty()) {
            showEmptyState()
        } else {
            showData(filtered)
        }
    }

    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
    }
}
