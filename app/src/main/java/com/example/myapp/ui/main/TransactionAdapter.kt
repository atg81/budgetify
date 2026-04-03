package com.example.myapp.ui.main

import android.graphics.Color
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.TextView
import androidx.recyclerview.widget.RecyclerView
import com.example.myapp.R
import com.example.myapp.data.model.Transaction
import java.text.NumberFormat
import java.text.SimpleDateFormat
import java.util.Locale

class TransactionAdapter(private var transactions: List<Transaction>) : 
    RecyclerView.Adapter<TransactionAdapter.ViewHolder>() {

    private val dateFormatIn = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", Locale.getDefault())
    private val dateFormatOut = SimpleDateFormat("dd MMM yyyy", Locale("tr"))
    private val currencyFormat = NumberFormat.getCurrencyInstance(Locale("tr", "TR"))

    class ViewHolder(view: View) : RecyclerView.ViewHolder(view) {
        val tvEmoji: TextView = view.findViewById(R.id.tv_category_emoji)
        val tvTitle: TextView = view.findViewById(R.id.tv_title)
        val tvDate: TextView = view.findViewById(R.id.tv_date)
        val tvAmount: TextView = view.findViewById(R.id.tv_amount)
    }

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): ViewHolder {
        val view = LayoutInflater.from(parent.context)
            .inflate(R.layout.item_transaction, parent, false)
        return ViewHolder(view)
    }

    override fun onBindViewHolder(holder: ViewHolder, position: Int) {
        val t = transactions[position]

        // Kategoriyi ID'den anlamak zor ama şimdilik generic emoji
        holder.tvEmoji.text = if (t.type == "income") "📈" else "📉"
        holder.tvTitle.text = t.description?.ifEmpty { "İşlem" } ?: "İşlem"

        // Tarih formatlama
        try {
            val date = dateFormatIn.parse(t.date)
            holder.tvDate.text = if (date != null) dateFormatOut.format(date) else t.date.substring(0, 10)
        } catch (e: Exception) {
            holder.tvDate.text = t.date.substring(0, 10)
        }

        // Tutar
        val sign = if (t.type == "income") "+" else "-"
        holder.tvAmount.text = "$sign${currencyFormat.format(t.amount)}"
        if (t.type == "expense") {
            holder.tvAmount.setTextColor(Color.parseColor("#CF6679"))
        } else {
            holder.tvAmount.setTextColor(Color.parseColor("#4CAF50"))
        }
    }

    override fun getItemCount() = transactions.size

    fun updateData(newTransactions: List<Transaction>) {
        transactions = newTransactions
        notifyDataSetChanged()
    }
}
