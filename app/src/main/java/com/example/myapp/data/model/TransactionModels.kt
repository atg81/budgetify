package com.example.myapp.data.model

import com.google.gson.annotations.SerializedName

data class Transaction(
    val id: String,
    @SerializedName("user_id")      val userId: String,
    @SerializedName("category_id")  val categoryId: String?,
    val amount: Double,
    val currency: String,
    val type: String,           // "income" | "expense"
    val date: String,
    val description: String?,
    @SerializedName("created_at")       val createdAt: String?,
    @SerializedName("category_name")    val categoryName: String?,
    @SerializedName("category_color")   val categoryColor: String?,
    @SerializedName("category_emoji")   val categoryEmoji: String?
)

data class Pagination(
    val total: Int,
    val limit: Int,
    val offset: Int,
    @SerializedName("hasMore") val hasMore: Boolean
)

data class TransactionsResponse(
    val success: Boolean,
    val data: List<Transaction>,
    val pagination: Pagination?
)

data class TransactionResponse(
    val success: Boolean,
    val data: Transaction?
)

data class CreateTransactionRequest(
    val amount: Double,
    val type: String,
    val date: String,
    @SerializedName("category_id") val categoryId: String? = null,
    val currency: String = "TRY",
    val description: String? = null
)

// Summary response
data class CurrencySummary(
    val income: Double,
    val expense: Double,
    val net: Double,
    @SerializedName("income_count") val incomeCount: Int,
    @SerializedName("expense_count") val expenseCount: Int
)

data class SummaryResponse(
    val success: Boolean,
    val data: Map<String, CurrencySummary>?
)
