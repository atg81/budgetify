package com.example.myapp.data.ai

import com.example.myapp.data.model.ReceiptAnalysis
import com.google.ai.client.generativeai.GenerativeModel
import com.google.gson.Gson
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

class GeminiService {
    
    // API KEY'i doğrudan koda gömdük (Kullanıcının isteği)
    private val apiKey = "AIzaSyCQ0gRnPkA-dzjZBCTDEjop4tT3xVhii84"

    // Kullanıcının API anahtarı son nesil 2.5 modellerini destekliyor
    private val generativeModel = GenerativeModel(
        modelName = "gemini-2.5-flash",
        apiKey = apiKey
    )

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

        try {
            val response = generativeModel.generateContent(prompt)
            val fullText = response.text ?: ""
            
            val jsonRegex = Regex("""\{[\s\S]*\}""")
            val matchResult = jsonRegex.find(fullText)
            
            val cleanJson = matchResult?.value
            
            if (cleanJson != null) {
                return@withContext Gson().fromJson(cleanJson, ReceiptAnalysis::class.java)
            } else {
                throw Exception("Yapay zeka JSON döndürmedi. Gelen cevap: \$fullText")
            }
        } catch (e: Exception) {
            e.printStackTrace()
            throw e // Hatayı yutmak yerine dışarı fırlatıyoruz ki ekranda görelim
        }
    }
}
