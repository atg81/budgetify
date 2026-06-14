package com.example.myapp.ui.main

import android.content.res.ColorStateList
import android.graphics.Color
import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import androidx.fragment.app.Fragment
import androidx.lifecycle.lifecycleScope
import com.example.myapp.R
import com.example.myapp.data.local.SessionManager
import com.example.myapp.data.network.RetrofitClient
import com.example.myapp.databinding.FragmentReportsBinding
import com.example.myapp.databinding.ItemReportCategoryBinding
import com.example.myapp.databinding.ItemReportTrendBinding
import kotlinx.coroutines.launch
import java.text.NumberFormat
import java.text.SimpleDateFormat
import java.util.*

class ReportsFragment : Fragment() {

    private var _binding: FragmentReportsBinding? = null
    private val binding get() = _binding!!

    private lateinit var sessionManager: SessionManager
    private val currencyFormat = NumberFormat.getCurrencyInstance(Locale("tr", "TR"))

    private val dateFormatInISO = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", Locale.US).apply {
        timeZone = TimeZone.getTimeZone("UTC")
    }
    private val dateFormatInSimple = SimpleDateFormat("yyyy-MM-dd", Locale.US)
    private val displayDateFormatDaily = SimpleDateFormat("dd MMM", Locale("tr"))
    private val displayDateFormatMonthly = SimpleDateFormat("MMMM", Locale("tr"))
    private val parseMonthYearFormat = SimpleDateFormat("yyyy-MM", Locale.US)

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
        sessionManager = SessionManager(requireContext())

        setupUI()
        setupPeriodToggle()
        
        // İlk açılışta aylık verileri yükle
        loadReports(isMonthly = true)
    }

    private fun setupUI() {
        // Aylık butonu varsayılan seçili
        binding.togglePeriod.check(binding.btnMonthly.id)
    }

    private fun setupPeriodToggle() {
        binding.togglePeriod.addOnButtonCheckedListener { _, checkedId, isChecked ->
            if (isChecked) {
                when (checkedId) {
                    binding.btnMonthly.id -> {
                        loadReports(isMonthly = true)
                    }
                    binding.btnYearly.id -> {
                        loadReports(isMonthly = false)
                    }
                }
            }
        }
    }

    private fun loadReports(isMonthly: Boolean) {
        // Yükleme durumu
        binding.emptyState.visibility = View.GONE
        binding.contentReports.visibility = View.GONE

        // Tarih aralığı belirleme
        val cal = Calendar.getInstance()
        val year = cal.get(Calendar.YEAR)
        val startDate: String
        val endDate: String

        if (isMonthly) {
            val month = cal.get(Calendar.MONTH) + 1 // 1-indexed
            startDate = String.format(Locale.US, "%d-%02d-01", year, month)
            val maxDay = cal.getActualMaximum(Calendar.DAY_OF_MONTH)
            endDate = String.format(Locale.US, "%d-%02d-%02d", year, month, maxDay)
        } else {
            startDate = "$year-01-01"
            endDate = "$year-12-31"
        }

        lifecycleScope.launch {
            try {
                val response = RetrofitClient.apiService.getTransactions(
                    token = sessionManager.bearerToken,
                    startDate = startDate,
                    endDate = endDate,
                    limit = 1000 // Yeterince büyük bir limit alıyoruz
                )

                if (response.isSuccessful && response.body()?.success == true) {
                    val transactions = response.body()?.data ?: emptyList()
                    if (transactions.isEmpty()) {
                        showEmptyState()
                    } else {
                        binding.emptyState.visibility = View.GONE
                        binding.contentReports.visibility = View.VISIBLE
                        populateReports(transactions, isMonthly)
                    }
                } else {
                    showEmptyState()
                }
            } catch (e: Exception) {
                e.printStackTrace()
                showEmptyState()
            }
        }
    }

    private fun populateReports(transactions: List<com.example.myapp.data.model.Transaction>, isMonthly: Boolean) {
        // 1. Özet Hesaplama
        val totalIncome = transactions.filter { it.type == "income" }.sumOf { it.amount }
        val totalExpense = transactions.filter { it.type == "expense" }.sumOf { it.amount }
        val net = totalIncome - totalExpense

        binding.tvSummaryIncome.text = currencyFormat.format(totalIncome)
        binding.tvSummaryExpense.text = currencyFormat.format(totalExpense)
        binding.tvSummaryNet.text = currencyFormat.format(net)

        if (net >= 0) {
            binding.tvSummaryNet.setTextColor(Color.parseColor("#4CAF50"))
        } else {
            binding.tvSummaryNet.setTextColor(Color.parseColor("#CF6679"))
        }

        // Gider filtreleme
        val expenses = transactions.filter { it.type == "expense" }

        // 2. Kategori Dağılımı (Harcama Dağılımı)
        binding.layoutDistributionList.removeAllViews()
        if (expenses.isEmpty()) {
            binding.cardDistribution.visibility = View.GONE
        } else {
            binding.cardDistribution.visibility = View.VISIBLE
            val totalExpenseSum = expenses.sumOf { it.amount }

            // Kategoriye göre grupla
            val groupedByCat = expenses.groupBy { it.categoryName ?: "Diğer" }
            val catSummaries = groupedByCat.map { (name, list) ->
                val sum = list.sumOf { it.amount }
                val emoji = list.firstOrNull()?.categoryEmoji ?: "📁"
                val colorHex = list.firstOrNull()?.categoryColor ?: "#9E9E9E"
                val percentage = if (totalExpenseSum > 0) ((sum / totalExpenseSum) * 100).toInt() else 0
                CategorySummary(name, emoji, colorHex, sum, percentage)
            }.sortedByDescending { it.amount }

            for (cat in catSummaries) {
                val itemBinding = ItemReportCategoryBinding.inflate(layoutInflater, binding.layoutDistributionList, false)
                itemBinding.tvCategoryEmoji.text = cat.emoji
                itemBinding.tvCategoryName.text = cat.name
                itemBinding.tvCategoryPercentage.text = "%${cat.percentage}"
                itemBinding.tvCategoryAmount.text = currencyFormat.format(cat.amount)
                itemBinding.pbCategoryProgress.progress = cat.percentage

                try {
                    val color = Color.parseColor(cat.color)
                    itemBinding.pbCategoryProgress.progressTintList = ColorStateList.valueOf(color)
                } catch (e: Exception) {
                    itemBinding.pbCategoryProgress.progressTintList = ColorStateList.valueOf(Color.parseColor("#9E9E9E"))
                }

                binding.layoutDistributionList.addView(itemBinding.root)
            }
        }

        // 3. Harcama Eğilimi (Zaman Bazlı)
        binding.layoutTrendList.removeAllViews()
        if (expenses.isEmpty()) {
            binding.cardTrend.visibility = View.GONE
        } else {
            binding.cardTrend.visibility = View.VISIBLE

            val trendList = if (isMonthly) {
                // Gün bazlı grupla
                val groupedByDay = expenses.groupBy { t ->
                    val parsed = parseTransactionDate(t.date)
                    if (parsed != null) dateFormatInSimple.format(parsed) else t.date.substring(0, 10)
                }
                groupedByDay.map { (dayKey, list) ->
                    val sum = list.sumOf { it.amount }
                    val parsedDate = try { dateFormatInSimple.parse(dayKey) } catch (e: Exception) { null }
                    val displayName = if (parsedDate != null) displayDateFormatDaily.format(parsedDate) else dayKey
                    TrendItem(dayKey, displayName, sum)
                }.sortedBy { it.sortKey }
            } else {
                // Ay bazlı grupla
                val groupedByMonth = expenses.groupBy { t ->
                    val parsed = parseTransactionDate(t.date)
                    if (parsed != null) SimpleDateFormat("yyyy-MM", Locale.US).format(parsed) else t.date.substring(0, 7)
                }
                groupedByMonth.map { (monthKey, list) ->
                    val sum = list.sumOf { it.amount }
                    val parsedDate = try { parseMonthYearFormat.parse(monthKey) } catch (e: Exception) { null }
                    val displayName = if (parsedDate != null) displayDateFormatMonthly.format(parsedDate) else monthKey
                    TrendItem(monthKey, displayName, sum)
                }.sortedBy { it.sortKey }
            }

            val maxPeriodAmount = trendList.maxOfOrNull { it.amount } ?: 0.0

            for (trend in trendList) {
                val itemBinding = ItemReportTrendBinding.inflate(layoutInflater, binding.layoutTrendList, false)
                itemBinding.tvTrendPeriod.text = trend.displayName
                itemBinding.tvTrendAmount.text = currencyFormat.format(trend.amount)
                
                val progress = if (maxPeriodAmount > 0) ((trend.amount / maxPeriodAmount) * 100).toInt() else 0
                itemBinding.pbTrendProgress.progress = progress

                binding.layoutTrendList.addView(itemBinding.root)
            }
        }
    }

    private fun parseTransactionDate(dateStr: String): Date? {
        return try {
            if (dateStr.contains("T")) {
                dateFormatInISO.parse(dateStr)
            } else {
                dateFormatInSimple.parse(dateStr)
            }
        } catch (e: Exception) {
            null
        }
    }

    private fun showEmptyState() {
        if (_binding == null) return
        binding.emptyState.visibility = View.VISIBLE
        binding.contentReports.visibility = View.GONE
    }

    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
    }

    // Yardımcı veri sınıfları
    private data class CategorySummary(
        val name: String,
        val emoji: String,
        val color: String,
        val amount: Double,
        val percentage: Int
    )

    private data class TrendItem(
        val sortKey: String,
        val displayName: String,
        val amount: Double
    )
}
