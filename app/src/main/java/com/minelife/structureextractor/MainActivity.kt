package com.minelife.structureextractor

import android.app.Activity
import android.content.Intent
import android.net.Uri
import android.os.Bundle
import android.util.Base64
import android.view.View
import android.view.WindowManager
import android.webkit.JavascriptInterface
import android.webkit.ValueCallback
import android.webkit.WebChromeClient
import android.webkit.WebResourceRequest
import android.webkit.WebView
import androidx.webkit.WebViewAssetLoader
import androidx.webkit.WebViewClientCompat
import java.io.File
import java.io.FileOutputStream

class MainActivity : Activity() {
    private lateinit var webView: WebView
    private var filePathCallback: ValueCallback<Array<Uri>>? = null
    private var exportFile: File? = null
    private var exportStream: FileOutputStream? = null
    private var exportName: String = "MCPE-Structures.zip"

    companion object {
        private const val REQUEST_PICK_WORLD = 4101
        private const val REQUEST_SAVE_EXPORT = 4102
        private const val MAX_EXPORT_BYTES = 1024L * 1024L * 1024L
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        window.statusBarColor = android.graphics.Color.rgb(16, 23, 18)
        window.navigationBarColor = android.graphics.Color.rgb(16, 23, 18)
        window.setSoftInputMode(WindowManager.LayoutParams.SOFT_INPUT_ADJUST_RESIZE)

        webView = WebView(this)
        webView.setBackgroundColor(android.graphics.Color.rgb(16, 23, 18))
        webView.overScrollMode = View.OVER_SCROLL_NEVER
        webView.settings.javaScriptEnabled = true
        webView.settings.domStorageEnabled = true
        webView.settings.allowFileAccess = false
        webView.settings.allowContentAccess = true
        webView.settings.setSupportZoom(false)
        webView.settings.javaScriptCanOpenWindowsAutomatically = false

        val assetLoader = WebViewAssetLoader.Builder()
            .addPathHandler("/assets/", WebViewAssetLoader.AssetsPathHandler(this))
            .build()

        webView.webViewClient = object : WebViewClientCompat() {
            override fun shouldInterceptRequest(
                view: WebView,
                request: WebResourceRequest
            ) = if (request.url.host == "appassets.androidplatform.net") {
                assetLoader.shouldInterceptRequest(request.url)
            } else {
                android.webkit.WebResourceResponse("text/plain", "utf-8", 403, "Blocked", emptyMap(), null)
            }

            override fun shouldOverrideUrlLoading(
                view: WebView,
                request: WebResourceRequest
            ): Boolean {
                return request.url.host != "appassets.androidplatform.net"
            }
        }

        webView.webChromeClient = object : WebChromeClient() {
            override fun onShowFileChooser(
                view: WebView,
                callback: ValueCallback<Array<Uri>>,
                params: FileChooserParams
            ): Boolean {
                filePathCallback?.onReceiveValue(null)
                filePathCallback = callback
                val intent = Intent(Intent.ACTION_OPEN_DOCUMENT).apply {
                    addCategory(Intent.CATEGORY_OPENABLE)
                    type = "*/*"
                    putExtra(Intent.EXTRA_MIME_TYPES, arrayOf(
                        "application/x-mcworld",
                        "application/zip",
                        "application/octet-stream"
                    ))
                }
                startActivityForResult(intent, REQUEST_PICK_WORLD)
                return true
            }
        }

        webView.addJavascriptInterface(ExportBridge(), "AndroidBridge")
        setContentView(webView)
        webView.loadUrl("https://appassets.androidplatform.net/assets/index.html")
    }

    private inner class ExportBridge {
        @JavascriptInterface
        fun beginExport(fileName: String): Boolean {
            return try {
                synchronized(this@MainActivity) {
                    exportStream?.close()
                    val safeName = fileName
                        .replace(Regex("[\\\\/:*?\"<>|]"), "_")
                        .take(120)
                        .ifBlank { "MCPE-Export.zip" }
                    exportName = safeName
                    exportFile = File(cacheDir, "pending-export.bin")
                    exportStream = FileOutputStream(exportFile!!, false)
                }
                true
            } catch (error: Exception) {
                reportExportStatus(false, error.message ?: "Could not prepare export.")
                false
            }
        }

        @JavascriptInterface
        fun appendExportChunk(base64Chunk: String): Boolean {
            return try {
                val bytes = Base64.decode(base64Chunk, Base64.DEFAULT)
                synchronized(this@MainActivity) {
                    val file = exportFile ?: throw IllegalStateException("Export has not started.")
                    if (file.length() + bytes.size > MAX_EXPORT_BYTES) {
                        throw IllegalStateException("Export exceeds the 1 GB safety limit.")
                    }
                    exportStream?.write(bytes) ?: throw IllegalStateException("Export stream is closed.")
                }
                true
            } catch (error: Exception) {
                reportExportStatus(false, error.message ?: "Could not write export data.")
                false
            }
        }

        @JavascriptInterface
        fun finishExport(): Boolean {
            return try {
                synchronized(this@MainActivity) {
                    exportStream?.flush()
                    exportStream?.close()
                    exportStream = null
                }
                runOnUiThread {
                    val mime = if (exportName.endsWith(".zip", true)) "application/zip" else "application/octet-stream"
                    val intent = Intent(Intent.ACTION_CREATE_DOCUMENT).apply {
                        addCategory(Intent.CATEGORY_OPENABLE)
                        type = mime
                        putExtra(Intent.EXTRA_TITLE, exportName)
                    }
                    startActivityForResult(intent, REQUEST_SAVE_EXPORT)
                }
                true
            } catch (error: Exception) {
                reportExportStatus(false, error.message ?: "Could not finish export.")
                false
            }
        }

        @JavascriptInterface
        fun cancelExport() {
            synchronized(this@MainActivity) {
                exportStream?.close()
                exportStream = null
                exportFile?.delete()
                exportFile = null
            }
        }
    }

    @Deprecated("Deprecated by Android, retained for broad API compatibility")
    override fun onActivityResult(requestCode: Int, resultCode: Int, data: Intent?) {
        super.onActivityResult(requestCode, resultCode, data)
        if (requestCode == REQUEST_PICK_WORLD) {
            val result = if (resultCode == RESULT_OK && data?.data != null) arrayOf(data.data!!) else null
            filePathCallback?.onReceiveValue(result)
            filePathCallback = null
            return
        }
        if (requestCode == REQUEST_SAVE_EXPORT) {
            val target = data?.data
            val source = exportFile
            if (resultCode == RESULT_OK && target != null && source != null) {
                try {
                    contentResolver.openOutputStream(target, "w")?.use { output ->
                        source.inputStream().use { input -> input.copyTo(output) }
                    } ?: throw IllegalStateException("Android could not open the destination.")
                    source.delete()
                    exportFile = null
                    reportExportStatus(true, "Export saved successfully.")
                } catch (error: Exception) {
                    reportExportStatus(false, error.message ?: "Could not save the export.")
                }
            } else {
                source?.delete()
                exportFile = null
                reportExportStatus(false, "Export cancelled.")
            }
        }
    }

    private fun reportExportStatus(success: Boolean, message: String) {
        runOnUiThread {
            if (::webView.isInitialized) {
                val quoted = org.json.JSONObject.quote(message)
                webView.evaluateJavascript(
                    "window.onNativeExportComplete && window.onNativeExportComplete(" + success + "," + quoted + ")",
                    null
                )
            }
        }
    }

    override fun onDestroy() {
        synchronized(this) {
            exportStream?.close()
            exportStream = null
        }
        if (::webView.isInitialized) {
            webView.removeJavascriptInterface("AndroidBridge")
            webView.destroy()
        }
        super.onDestroy()
    }
}
