package com.example.myapp.data.network

import com.example.myapp.data.model.*
import retrofit2.Response
import retrofit2.http.*

interface ApiService {

    // ── Auth ─────────────────────────────────────
    @POST("api/auth/register")
    suspend fun register(@Body body: RegisterRequest): Response<AuthResponse>

    @POST("api/auth/login")
    suspend fun login(@Body body: LoginRequest): Response<AuthResponse>

    @GET("api/auth/me")
    suspend fun getMe(@Header("Authorization") token: String): Response<UserResponse>

    // ── Categories ───────────────────────────────
    @GET("api/categories")
    suspend fun getCategories(
        @Header("Authorization") token: String
    ): Response<CategoriesResponse>

    @POST("api/categories")
    suspend fun createCategory(
        @Header("Authorization") token: String,
        @Body body: CreateCategoryRequest
    ): Response<CategoryResponse>

    // ── Transactions ─────────────────────────────
    @GET("api/transactions")
    suspend fun getTransactions(
        @Header("Authorization") token: String,
        @Query("type")        type: String?  = null,
        @Query("category_id") categoryId: String? = null,
        @Query("start_date")  startDate: String? = null,
        @Query("end_date")    endDate: String? = null,
        @Query("limit")       limit: Int = 50,
        @Query("offset")      offset: Int = 0
    ): Response<TransactionsResponse>

    @GET("api/transactions/summary")
    suspend fun getSummary(
        @Header("Authorization") token: String,
        @Query("start_date") startDate: String? = null,
        @Query("end_date")   endDate: String? = null
    ): Response<SummaryResponse>

    @GET("api/transactions/{id}")
    suspend fun getTransaction(
        @Header("Authorization") token: String,
        @Path("id") id: String
    ): Response<TransactionResponse>

    @POST("api/transactions")
    suspend fun createTransaction(
        @Header("Authorization") token: String,
        @Body body: CreateTransactionRequest
    ): Response<TransactionResponse>

    @PUT("api/transactions/{id}")
    suspend fun updateTransaction(
        @Header("Authorization") token: String,
        @Path("id") id: String,
        @Body body: CreateTransactionRequest
    ): Response<TransactionResponse>

    @DELETE("api/transactions/{id}")
    suspend fun deleteTransaction(
        @Header("Authorization") token: String,
        @Path("id") id: String
    ): Response<Unit>
}
