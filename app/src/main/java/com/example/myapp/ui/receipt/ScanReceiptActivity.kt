package com.example.myapp.ui.receipt

import android.net.Uri
import android.os.Bundle
import android.view.View
import android.widget.Toast
import androidx.activity.result.contract.ActivityResultContracts
import androidx.appcompat.app.AppCompatActivity
import androidx.core.content.FileProvider
import androidx.lifecycle.lifecycleScope
import com.example.myapp.data.ai.GeminiService
import com.example.myapp.data.local.SessionManager
import com.example.myapp.data.model.CreateTransactionRequest
import com.example.myapp.data.model.ReceiptAnalysis
import com.example.myapp.data.network.RetrofitClient
import com.example.myapp.databinding.ActivityScanReceiptBinding
import com.google.android.material.snackbar.Snackbar
import com.google.mlkit.vision.common.InputImage
import com.google.mlkit.vision.text.TextRecognition
import com.google.mlkit.vision.text.latin.TextRecognizerOptions
import kotlinx.coroutines.launch
import java.io.File

class ScanReceiptActivity : AppCompatActivity() {

    private lateinit var binding: ActivityScanReceiptBinding
    private lateinit var sessionManager: SessionManager
    private val geminiService = GeminiService()

    private var imageUri: Uri? = null
    private var currentAnalysis: ReceiptAnalysis? = null

    private val takePictureLauncher = registerForActivityResult(ActivityResultContracts.TakePicture()) { success ->
        if (success) {
            imageUri?.let { uri ->
                binding.ivReceipt.setImageURI(uri)
                processImageWithMLKit(uri)
            }
        } else {
            Toast.makeText(this, "Fotoğraf çekimi iptal edildi", Toast.LENGTH_SHORT).show()
        }
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityScanReceiptBinding.inflate(layoutInflater)
        setContentView(binding.root)

        sessionManager = SessionManager(this)

        binding.btnBack.setOnClickListener { finish() }
        
        binding.btnTakePhoto.setOnClickListener {
            startCamera()
        }

        binding.btnSave.setOnClickListener {
            currentAnalysis?.let { analysis ->
                saveTransactionToApi(analysis)
            }
        }
        
        // İlk açılışta hemen kamerayı başlat (UX)
        startCamera()
    }

    private fun startCamera() {
        val tempFile = File.createTempFile("receipt_", ".jpg", cacheDir).apply {
            createNewFile()
            deleteOnExit()
        }
        imageUri = FileProvider.getUriForFile(this, "${packageName}.fileprovider", tempFile)
        takePictureLauncher.launch(imageUri)
    }

    private fun processImageWithMLKit(uri: Uri) {
        setLoadingState(true, "Fiş okunuyor (OCR)...")
        
        try {
            val image = InputImage.fromFilePath(this, uri)
            val recognizer = TextRecognition.getClient(TextRecognizerOptions.DEFAULT_OPTIONS)
            
            recognizer.process(image)
                .addOnSuccessListener { visionText ->
                    if (visionText.text.isBlank()) {
                        setLoadingState(false)
                        Snackbar.make(binding.root, "Fişte okunabilir metin bulunamadı", Snackbar.LENGTH_LONG).show()
                    } else {
                        analyzeWithGemini(visionText.text)
                    }
                }
                .addOnFailureListener { e ->
                    setLoadingState(false)
                    Snackbar.make(binding.root, "OCR Hatası: ${e.message}", Snackbar.LENGTH_LONG).show()
                }
        } catch (e: Exception) {
            setLoadingState(false)
            e.printStackTrace()
        }
    }

    private fun analyzeWithGemini(ocrText: String) {
        setLoadingState(true, "AI Analizi yapılıyor...")
        
        lifecycleScope.launch {
            try {
                val result = geminiService.analyzeReceipt(ocrText)
                setLoadingState(false)
                if (result != null) {
                    currentAnalysis = result
                    showAnalysisResult(result)
                }
            } catch (e: Exception) {
                setLoadingState(false)
                Snackbar.make(binding.root, "Analiz Hatası: ${e.message}", Snackbar.LENGTH_INDEFINITE).show()
                e.printStackTrace()
            }
        }
    }

    private fun showAnalysisResult(res: ReceiptAnalysis) {
        binding.cardResult.visibility = View.VISIBLE
        binding.tvResAmount.text = "Tutar: ₺${res.totalAmount}"
        binding.tvResDate.text = "Tarih: ${res.date}"
        binding.tvResCategory.text = "Kategori: ${res.category}"
        binding.tvResDesc.text = "Açıklama: ${res.description}"
    }

    private fun saveTransactionToApi(res: ReceiptAnalysis) {
        setLoadingState(true, "Kaydediliyor...")
        binding.btnSave.isEnabled = false

        lifecycleScope.launch {
            try {
                // Kategori ID'sini çekmek için mevcut liste isteği
                val catRes = RetrofitClient.apiService.getCategories(sessionManager.bearerToken)
                val categories = if (catRes.isSuccessful) catRes.body()?.data ?: emptyList() else emptyList()
                
                val matchedCategory = categories.find { it.name == res.category }
                
                val req = CreateTransactionRequest(
                    amount = res.totalAmount,
                    type = "expense",
                    date = res.date,
                    categoryId = matchedCategory?.id,
                    currency = "TRY",
                    description = res.description
                )

                val addRes = RetrofitClient.apiService.createTransaction(sessionManager.bearerToken, req)
                if (addRes.isSuccessful && addRes.body()?.success == true) {
                    Toast.makeText(this@ScanReceiptActivity, "Fiş kaydedildi!", Toast.LENGTH_SHORT).show()
                    finish()
                } else {
                    Snackbar.make(binding.root, "Kayıt hatası: ${addRes.code()}", Snackbar.LENGTH_LONG).show()
                    binding.btnSave.isEnabled = true
                }
            } catch (e: Exception) {
                Snackbar.make(binding.root, "Bağlantı hatası: ${e.message}", Snackbar.LENGTH_LONG).show()
                binding.btnSave.isEnabled = true
            } finally {
                if (binding.btnSave.isEnabled == false) {
                   setLoadingState(false)
                }
            }
        }
    }

    private fun setLoadingState(isLoading: Boolean, msg: String = "") {
        binding.progressBar.visibility = if (isLoading) View.VISIBLE else View.GONE
        binding.tvLoadingStatus.visibility = if (isLoading) View.VISIBLE else View.GONE
        binding.tvLoadingStatus.text = msg
        binding.btnTakePhoto.isEnabled = !isLoading
    }
}
