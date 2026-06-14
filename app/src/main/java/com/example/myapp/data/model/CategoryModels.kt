package com.example.myapp.data.model

import com.google.gson.annotations.SerializedName

data class Category(
    val id: String,
    @SerializedName("user_id") val userId: String?,
    val name: String,
    val color: String?,
    val emoji: String?,
    @SerializedName("is_default") val isDefault: Boolean,
    @SerializedName("created_at") val createdAt: String?
)

data class CategoriesResponse(
    val success: Boolean,
    val data: List<Category>
)

data class CategoryResponse(
    val success: Boolean,
    val data: Category?
)

data class CreateCategoryRequest(
    val name: String,
    val color: String? = null,
    val emoji: String? = null
)
