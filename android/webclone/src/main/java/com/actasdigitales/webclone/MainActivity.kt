package com.actasdigitales.webclone

import android.annotation.SuppressLint
import android.app.Activity
import android.app.AlertDialog
import android.content.Intent
import android.graphics.Bitmap
import android.net.Uri
import android.net.http.SslError
import android.os.Bundle
import android.view.Menu
import android.view.MenuItem
import android.view.View
import android.view.ViewGroup
import android.view.Window
import android.webkit.DownloadListener
import android.webkit.SslErrorHandler
import android.webkit.WebChromeClient
import android.webkit.WebChromeClient.FileChooserParams
import android.webkit.WebResourceError
import android.webkit.WebResourceRequest
import android.webkit.WebView
import android.webkit.WebViewClient
import android.widget.EditText
import android.widget.LinearLayout
import android.widget.TextView
import android.widget.Toast
import android.widget.ProgressBar
import android.webkit.ValueCallback

/**
 * Actas Digitales Web — «clon Web» del servidor.
 *
 * Una WebView de pantalla completa apuntando al servidor Actas Digitales
 * (configurable desde el menú → «Cambiar servidor…», persistente en
 * SharedPreferences). Es la MISMA interfaz que se sirve en `/`.
 *
 * Seguridad: solo http/https; sin cleartext fuera de los hosts de desarrollo
 * (ver network_security_config.xml); los errores de TLS NO se aceptan jamás.
 * Las descargas se abren con el gestor externo (navegador/Descargas).
 */
class MainActivity : Activity() {

    private lateinit var webView: WebView
    private lateinit var progress: ProgressBar
    private lateinit var prefs: android.content.SharedPreferences

    private var fileChooserCallback: ValueCallback<Array<Uri>>? = null

    companion object {
        private const val PREFS = "actas_webclone"
        private const val KEY_URL = "server_url"
        private const val REQ_FILE_CHOOSER = 4321
    }

    private fun currentUrl(): String {
        val stored = prefs.getString(KEY_URL, null)?.trim()
        return if (!stored.isNullOrEmpty()) normalizeUrl(stored) else BuildConfig.ACTAS_WEB_URL
    }

    private fun normalizeUrl(raw: String): String {
        val trimmed = raw.trim()
        val withScheme = if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) trimmed else "https://$trimmed"
        return if (withScheme.endsWith("/")) withScheme else "$withScheme/"
    }

    @SuppressLint("SetJavaScriptEnabled", "AddJavascriptInterface")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        prefs = getSharedPreferences(PREFS, MODE_PRIVATE)

        val root = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            layoutParams = LinearLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT)
        }
        progress = ProgressBar(this, null, android.R.attr.progressBarStyleHorizontal).apply {
            max = 100
            visibility = View.VISIBLE
            layoutParams = LinearLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT, (2 * resources.displayMetrics.density).toInt())
        }
        webView = WebView(this).apply {
            layoutParams = LinearLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT)
        }
        root.addView(progress)
        root.addView(webView)
        setContentView(root)

        val settings = webView.settings
        settings.javaScriptEnabled = true
        settings.domStorageEnabled = true
        settings.databaseEnabled = true
        settings.mediaPlaybackRequiresUserGesture = false
        settings.allowFileAccess = false
        settings.allowContentAccess = true  // selector de ficheros (actas/audio) vía SAF
        settings.mixedContentMode = android.webkit.WebSettings.MIXED_CONTENT_NEVER_ALLOW
        settings.userAgentString = settings.userAgentString + " ActasDigitalesWeb/1.0"
        settings.setSupportZoom(true)
        settings.builtInZoomControls = false
        WebView.setWebContentsDebuggingEnabled(false)

        webView.webViewClient = object : WebViewClient() {
            override fun onPageStarted(view: WebView, url: String?, favicon: Bitmap?) {
                progress.visibility = View.VISIBLE
            }

            override fun onPageFinished(view: WebView, url: String?) {
                progress.visibility = View.GONE
            }

            override fun onReceivedError(view: WebView, request: WebResourceRequest, error: WebResourceError) {
                if (request.isForMainFrame) {
                    showOfflinePage(view, error.description?.toString() ?: "error de red")
                }
            }

            override fun onReceivedSslError(view: WebView, handler: SslErrorHandler, error: SslError) {
                // Nunca aceptar certificados inválidos: se cancela y se avisa.
                handler.cancel()
                Toast.makeText(this@MainActivity,
                    "Certificado TLS inválido (${error.primaryError}). Conexión rechazada.",
                    Toast.LENGTH_LONG).show()
            }

            override fun shouldOverrideUrlLoading(view: WebView, request: WebResourceRequest): Boolean {
                val url = request.url ?: return false
                val scheme = url.scheme?.lowercase()
                return when (scheme) {
                    "http", "https" -> false          // navegar dentro del WebView
                    else -> {                          // mailto:, tel:, intent:… → fuera
                        runCatching { startActivity(Intent(Intent.ACTION_VIEW, url)) }
                        true
                    }
                }
            }
        }

        webView.webChromeClient = object : WebChromeClient() {
            override fun onProgressChanged(view: WebView, newProgress: Int) {
                progress.progress = newProgress
            }

            override fun onShowFileChooser(
                webView: WebView?,
                callback: ValueCallback<Array<Uri>>?,
                params: FileChooserParams?
            ): Boolean {
                fileChooserCallback = callback
                val intent = try {
                    params?.createIntent() ?: Intent(Intent.ACTION_GET_CONTENT).apply {
                        addCategory(Intent.CATEGORY_OPENABLE)
                        type = "*/*"
                        putExtra(Intent.EXTRA_ALLOW_MULTIPLE, true)
                    }
                } catch (e: Exception) {
                    Intent(Intent.ACTION_GET_CONTENT).apply {
                        addCategory(Intent.CATEGORY_OPENABLE)
                        type = "*/*"
                        putExtra(Intent.EXTRA_ALLOW_MULTIPLE, true)
                    }
                }
                return try {
                    startActivityForResult(Intent.createChooser(intent, "Elegir fichero"), REQ_FILE_CHOOSER)
                    true
                } catch (e: Exception) {
                    fileChooserCallback = null
                    false
                }
            }
        }

        webView.setDownloadListener { url, _, _, _, _ ->
            // Descargas (PDF/APK del acta): se abren con el gestor externo, nunca se traen al WebView.
            runCatching { startActivity(Intent(Intent.ACTION_VIEW, Uri.parse(url))) }
                .onFailure { Toast.makeText(this, "No se pudo abrir la descarga.", Toast.LENGTH_SHORT).show() }
        }

        if (savedInstanceState == null) {
            webView.loadUrl(currentUrl())
        } else {
            webView.restoreState(savedInstanceState)
        }
    }

    override fun onCreateOptionsMenu(menu: Menu): Boolean {
        menu.add(0, 1, 0, "Recargar").setShowAsAction(MenuItem.SHOW_AS_ACTION_NEVER)
        menu.add(0, 2, 1, "Cambiar servidor…").setShowAsAction(MenuItem.SHOW_AS_ACTION_NEVER)
        menu.add(0, 3, 2, "Restablecer servidor por defecto").setShowAsAction(MenuItem.SHOW_AS_ACTION_NEVER)
        return true
    }

    override fun onOptionsItemSelected(item: MenuItem): Boolean = when (item.itemId) {
        1 -> { webView.reload(); true }
        2 -> { promptChangeServer(); true }
        3 -> { prefs.edit().remove(KEY_URL).apply(); webView.loadUrl(currentUrl()); true }
        else -> super.onOptionsItemSelected(item)
    }

    private fun promptChangeServer() {
        val input = EditText(this).apply {
            setText(currentUrl())
            setSelection(text.length)
            hint = "https://servidor:puerto/"
        }
        val box = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            setPadding(48, 16, 48, 0)
            addView(TextView(this@MainActivity).apply {
                text = "URL del servidor Actas Digitales (p. ej. https://192.168.1.50:8000/ )"
            })
            addView(input)
        }
        AlertDialog.Builder(this)
            .setTitle("Cambiar servidor")
            .setView(box)
            .setPositiveButton("Guardar y cargar") { _, _ ->
                val url = normalizeUrl(input.text.toString())
                prefs.edit().putString(KEY_URL, url).apply()
                webView.loadUrl(url)
            }
            .setNegativeButton("Cancelar", null)
            .show()
    }

    private fun showOfflinePage(view: WebView, detail: String) {
        val html = """
            <!doctype html><html lang="es"><head><meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1">
            <style>body{font-family:system-ui;background:#0f172a;color:#e2e8f0;display:flex;
            flex-direction:column;align-items:center;justify-content:center;min-height:100vh;margin:0;padding:24px;text-align:center}
            h1{font-size:1.25rem;color:#a5b4fc} code{background:#1e293b;padding:2px 6px;border-radius:6px}
            button{margin-top:16px;padding:12px 28px;border:0;border-radius:12px;background:#4f46e5;color:#fff;font-size:1rem}
            </style></head><body>
            <h1>Sin conexión con el servidor</h1>
            <p>No se pudo cargar <code>${view.url ?: ""}</code><br/>($detail)</p>
            <p>¿Servidor encendido? ¿URL correcta? Revisa <em>menú → Cambiar servidor…</em></p>
            <button onclick="location.reload()">Reintentar</button>
            </body></html>
        """.trimIndent()
        view.loadDataWithBaseURL(null, html, "text/html", "utf-8", null)
    }

    @Deprecated("WebView file chooser (API pre-29): startActivityForResult es el camino soportado")
    @Suppress("DEPRECATION")
    override fun onActivityResult(requestCode: Int, resultCode: Int, data: Intent?) {
        super.onActivityResult(requestCode, resultCode, data)
        if (requestCode != REQ_FILE_CHOOSER) return
        val callback = fileChooserCallback
        fileChooserCallback = null
        if (callback == null) return
        val results: Array<Uri>? = try {
            if (resultCode == RESULT_OK && data != null) {
                val clip = data.clipData
                if (clip != null) (0 until clip.itemCount).map { clip.getItemAt(it).uri }.toTypedArray()
                else data.data?.let { arrayOf(it) }
            } else null
        } catch (e: SecurityException) {
            null
        }
        callback.onReceiveValue(results)
    }

    override fun onBackPressed() {
        if (webView.canGoBack()) webView.goBack() else super.onBackPressed()
    }

    override fun onSaveInstanceState(outState: Bundle) {
        super.onSaveInstanceState(outState)
        webView.saveState(outState)
    }

    override fun onDestroy() {
        (webView.parent as? ViewGroup)?.removeView(webView)
        webView.destroy()
        super.onDestroy()
    }
}
