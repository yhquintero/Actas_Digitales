package com.actasdigitales.app.ui.components

import android.widget.Toast
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.actasdigitales.app.data.api.ServerPreferences
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import okhttp3.OkHttpClient
import okhttp3.Request
import java.util.concurrent.TimeUnit

/**
 * Diálogo de Ajustes del servidor. Arregla el error típico `10.0.2.2:8443`:
 * esa dirección sólo existe dentro del emulador y sólo con HTTPS y la CA del
 * proyecto instalada. Aquí el usuario elige la URL correcta (emulador, LAN o
 * despliegue público) y puede PROBARLA contra `/api/health` antes de guardar.
 */
@Composable
fun ServerSettingsDialog(onDismiss: () -> Unit) {
    val context = LocalContext.current
    var url by remember { mutableStateOf(ServerPreferences.load(context)) }
    var testing by remember { mutableStateOf(false) }
    var testResult by remember { mutableStateOf<String?>(null) }

    fun probarConexion() {
        testing = true
        testResult = null
        CoroutineScope(Dispatchers.IO).launch {
            val normalized = try {
                ServerPreferences.normalize(url)
            } catch (e: Exception) {
                withContext(Dispatchers.Main) {
                    testResult = "✗ URL inválida"
                    testing = false
                }
                return@launch
            }
            val client = OkHttpClient.Builder()
                .connectTimeout(8, TimeUnit.SECONDS)
                .readTimeout(8, TimeUnit.SECONDS)
                .build()
            val request = Request.Builder()
                .url(normalized + "api/health")
                .get()
                .build()
            val outcome = try {
                client.newCall(request).execute().use { response ->
                    if (response.isSuccessful) {
                        "✓ Conexión correcta (${response.code})"
                    } else {
                        "✗ El servidor respondió ${response.code}"
                    }
                }
            } catch (e: Exception) {
                "✗ No conecta: ${e.message?.take(120) ?: e.javaClass.simpleName}"
            }
            withContext(Dispatchers.Main) {
                testResult = outcome
                testing = false
            }
        }
    }

    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("Servidor del acta", fontWeight = FontWeight.Bold) },
        text = {
            Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                Text(
                    "10.0.2.2 sólo existe DENTRO del emulador Android. En un móvil físico " +
                        "usa la IP/nombre de tu servidor por HTTPS (con la CA del proyecto " +
                        "instalada) o el nombre actasdigitales.local en HTTP.",
                    fontSize = 12.sp
                )
                OutlinedTextField(
                    value = url,
                    onValueChange = { url = it },
                    label = { Text("URL base del servidor") },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth()
                )
                Text(
                    "Preajustes habituales (toca para rellenar):",
                    fontSize = 11.sp,
                    color = androidx.compose.ui.graphics.Color.Unspecified
                )
                ServerPreferences.PRESETS.forEach { (label, preset) ->
                    OutlinedButton(
                        onClick = { url = preset },
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Text(label, fontSize = 11.sp)
                    }
                }
                Button(
                    onClick = { probarConexion() },
                    enabled = !testing,
                    modifier = Modifier.fillMaxWidth(),
                    colors = ButtonDefaults.buttonColors()
                ) {
                    Text(if (testing) "Probando…" else "Probar conexión (/api/health)")
                }
                testResult?.let {
                    Text(it, fontSize = 12.sp, fontWeight = FontWeight.SemiBold)
                }
            }
        },
        confirmButton = {
            TextButton(onClick = {
                try {
                    val saved = ServerPreferences.save(context, url)
                    Toast.makeText(context, "Servidor guardado: $saved", Toast.LENGTH_LONG).show()
                    onDismiss()
                } catch (e: Exception) {
                    Toast.makeText(context, e.message ?: "URL inválida", Toast.LENGTH_LONG).show()
                }
            }) { Text("Guardar") }
        },
        dismissButton = {
            TextButton(onClick = onDismiss) { Text("Cancelar") }
        }
    )
}
