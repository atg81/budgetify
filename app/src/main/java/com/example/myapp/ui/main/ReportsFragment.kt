package com.example.myapp.ui.main

import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import androidx.fragment.app.Fragment
import com.example.myapp.databinding.FragmentReportsBinding

class ReportsFragment : Fragment() {

    private var _binding: FragmentReportsBinding? = null
    private val binding
        get() = _binding!!

    override fun onCreateView(
            inflater: LayoutInflater,
            container: ViewGroup?,
            savedInstanceState: Bundle?
    ): View {
        _binding = FragmentReportsBinding.inflate(inflater, container, false)
        return binding.root
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)

        setupUI()
        setupPeriodToggle()
    }

    private fun setupUI() {
        // Empty state göster (veri olmadığı için)
        binding.emptyState.visibility = View.VISIBLE
        binding.contentReports.visibility = View.GONE

        // Aylık butonu varsayılan seçili
        binding.togglePeriod.check(binding.btnMonthly.id)
    }

    private fun setupPeriodToggle() {
        binding.togglePeriod.addOnButtonCheckedListener { _, checkedId, isChecked ->
            if (isChecked) {
                when (checkedId) {
                    binding.btnMonthly.id -> {
                        // TODO: Aylık raporları göster
                    }
                    binding.btnYearly.id -> {
                        // TODO: Yıllık raporları göster
                    }
                }
            }
        }
    }

    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
    }
}
