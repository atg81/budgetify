package com.example.myapp.data.ai

import com.example.myapp.BuildConfig
import com.example.myapp.data.model.ReceiptAnalysis
import com.google.gson.Gson
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import org.json.JSONArray
import org.json.JSONObject
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale
import java.util.concurrent.TimeUnit

class GeminiService {

    // Groq API Key - local.properties'den okunur (GitHub'a gitmez)
    private val apiKey = BuildConfig.GEMINI_API_KEY

    // Groq ücretsiz, hızlı ve güvenilir
    private val groqUrl = "https://api.groq.com/openai/v1/chat/completions"
    private val modelName = "llama-3.1-8b-instant"

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

        // Groq - OpenAI uyumlu format
        val jsonPayload = JSONObject().apply {
            put("model", modelName)
            put("messages", JSONArray().apply {
                put(JSONObject().apply {
                    put("role", "user")
                    put("content", prompt)
                })
            })
            put("max_tokens", 300)
            put("temperature", 0.1)
        }

        val requestBody = jsonPayload.toString().toRequestBody("application/json; charset=utf-8".toMediaType())

        val request = Request.Builder()
            .url(groqUrl)
            .header("Authorization", "Bearer $apiKey")
            .header("Content-Type", "application/json")
            .post(requestBody)
            .build()

        try {
            val response = client.newCall(request).execute()
            val responseString = response.body?.string() ?: ""

            if (!response.isSuccessful) {
                throw Exception("API Hatası (Kod: ${response.code}): $responseString")
            }

            // Groq - OpenAI uyumlu cevap formatı
            val responseJson = JSONObject(responseString)
            val choices = responseJson.optJSONArray("choices")
            if (choices == null || choices.length() == 0) {
                throw Exception("Yapay zeka cevap döndürmedi: $responseString")
            }

            val textResult = choices.getJSONObject(0)
                .getJSONObject("message")
                .getString("content")

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
            throw Exception(e.message)
        }
    }
}
