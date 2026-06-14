package com.example.myapp.data.ai

import com.example.myapp.data.model.ReceiptAnalysis
import com.google.gson.Gson
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import org.json.JSONObject
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale
import java.util.concurrent.TimeUnit

class GeminiService {
    
    // Key local.properties'den okunur (GitHub'a gitmez)
    private val apiKey = BuildConfig.GEMINI_API_KEY
    private val modelName = "gemini-2.0-flash"

    private val client = OkHttpClient.Builder()
        .connectTimeout(60, TimeUnit.SECONDS)
        .readTimeout(60, TimeUnit.SECONDS)
        .writeTimeout(60, TimeUnit.SECONDS)
        .build()

    suspend fun analyzeReceipt(ocrText: String): ReceiptAnalysis? = withContext(Dispatchers.IO) {
        val todayStr = SimpleDateFormat("yyyy-MM-dd", Locale.getDefault()).format(Date())
        
        val prompt = """
            Sen otomatik bir sistemin parçası olan uzman bir makbuz analisti yapay zekasın. 
            Aşağıdaki OCR metnindeki bilgileri çıkarıp SADECE ve SADECE geçerli bir JSON nesnesi döndür.
            Başka hiçbir selamlama, kapanış cümlesi VEYA ek açıklama yapma. Markdown (```json) GÖNDERME!
            
            Format zorunluluğu:
            {
              "totalAmount": (sadece RAKAM ve NOKTA kullanarak yaz, örn: 154.50),
              "date": ("$todayStr" formatında tarih),
              "category": (Sadece şu 5 seçenekten biri: "Yiyecek & Market", "Kira & Konut", "Eğlence", "Ulaşım", "Diğer"),
              "description": (Kısa bir satıcı/marka ismi)
            }
            
            OCR Metni:
            $ocrText
        """.trimIndent()

        // Google Gemini API Request Body Builder
        val jsonPayload = JSONObject().apply {
            put("contents", org.json.JSONArray().apply {
                put(JSONObject().apply {
                    put("parts", org.json.JSONArray().apply {
                        put(JSONObject().apply {
                            put("text", prompt)
                        })
                    })
                })
            })
        }

        val requestBody = jsonPayload.toString().toRequestBody("application/json; charset=utf-8".toMediaType())

        // AIzaSy → API Key (URL parametresi), AQ. → OAuth Token (Bearer header)
        val isOAuthToken = apiKey.startsWith("AQ.")
        val url = if (isOAuthToken)
            "https://generativelanguage.googleapis.com/v1beta/models/$modelName:generateContent"
        else
            "https://generativelanguage.googleapis.com/v1beta/models/$modelName:generateContent?key=$apiKey"

        val requestBuilder = Request.Builder()
            .url(url)
            .header("User-Agent", "Mozilla/5.0 (Linux; Android 10; Mobile)")
            .post(requestBody)

        if (isOAuthToken) {
            requestBuilder.header("Authorization", "Bearer $apiKey")
        }

        val request = requestBuilder.build()

        try {
            val response = client.newCall(request).execute()
            val responseString = response.body?.string() ?: ""

            if (!response.isSuccessful) {
                // Hatanın tam içeriğini alıyoruz ki ne olduğunu öğrenelim (kota mı, api key mi, konum mu)
                throw Exception("API Hatası (Kod: ${response.code}): $responseString")
            }

            // Başarılı cevabı parse etme
            val responseJson = JSONObject(responseString)
            val candidates = responseJson.optJSONArray("candidates")
            if (candidates == null || candidates.length() == 0) {
                throw Exception("Yapay zeka cevap döndürmedi: $responseString")
            }

            val textResult = candidates.getJSONObject(0)
                .getJSONObject("content")
                .getJSONArray("parts")
                .getJSONObject(0)
                .getString("text")

            val jsonRegex = Regex("""\{[\s\S]*\}""")
            val matchResult = jsonRegex.find(textResult)
            val cleanJson = matchResult?.value

            if (cleanJson != null) {
                return@withContext Gson().fromJson(cleanJson, ReceiptAnalysis::class.java)
            } else {
                throw Exception("Yapay zeka JSON formatında cevap vermedi. Gelen cevap: $textResult")
            }
        } catch (e: Exception) {
            e.printStackTrace()
            throw Exception(e.message) // Hata mesajını UI'a yansıt
        }
    }
}
