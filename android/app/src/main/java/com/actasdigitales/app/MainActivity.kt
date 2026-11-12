package com.actasdigitales.app

import android.os.Bundle
import android.view.MotionEvent
import androidx.activity.ComponentActivity
import androidx.activity.compose.BackHandler
import androidx.activity.compose.setContent
import androidx.activity.viewModels
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.History
import androidx.compose.material.icons.filled.Mic
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.NavigationBar
import androidx.compose.material3.NavigationBarItem
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import com.actasdigitales.app.ui.screens.HistoryScreen
import com.actasdigitales.app.ui.screens.HomeScreen
import com.actasdigitales.app.ui.theme.ActasDigitalesTheme
import com.actasdigitales.app.ui.theme.ThemeMode
import com.actasdigitales.app.ui.viewmodel.AudioViewModel

class MainActivity : ComponentActivity() {

    private val viewModel: AudioViewModel by viewModels()

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        setContent {
            var themeMode by rememberSaveable { mutableStateOf(ThemeMode.SYSTEM) }
            var selectedTab by rememberSaveable { mutableIntStateOf(TAB_CAPTURE) }

            // En el móvil, el gesto/botón Atrás desde Historial regresa a Captura
            // en lugar de cerrar la aplicación de golpe.
            BackHandler(enabled = selectedTab != TAB_CAPTURE) {
                selectedTab = TAB_CAPTURE
            }

            ActasDigitalesTheme(themeMode = themeMode) {
                Scaffold(
                    modifier = Modifier.fillMaxSize(),
                    bottomBar = {
                        NavigationBar(
                            containerColor = MaterialTheme.colorScheme.surfaceVariant,
                            contentColor = MaterialTheme.colorScheme.primary
                        ) {
                            NavigationBarItem(
                                selected = selectedTab == TAB_CAPTURE,
                                onClick = { selectedTab = TAB_CAPTURE },
                                icon = { Icon(Icons.Default.Mic, contentDescription = null) },
                                label = { Text("Captura", fontWeight = FontWeight.Bold) }
                            )
                            NavigationBarItem(
                                selected = selectedTab == TAB_HISTORY,
                                onClick = { selectedTab = TAB_HISTORY },
                                icon = { Icon(Icons.Default.History, contentDescription = null) },
                                label = { Text("Historial", fontWeight = FontWeight.Bold) }
                            )
                        }
                    }
                ) { innerPadding ->
                    Surface(
                        modifier = Modifier
                            .fillMaxSize()
                            .padding(innerPadding),
                        color = MaterialTheme.colorScheme.background
                    ) {
                        when (selectedTab) {
                            TAB_CAPTURE -> HomeScreen(
                                viewModel = viewModel,
                                themeMode = themeMode,
                                onThemeModeChange = { themeMode = it }
                            )
                            else -> HistoryScreen(
                                viewModel = viewModel,
                                themeMode = themeMode,
                                onThemeModeChange = { themeMode = it }
                            )
                        }
                    }
                }
            }
        }
    }

    /**
     * Mitigación del cierre inesperado de Compose con punteros externos:
     *
     *   java.lang.IllegalStateException: The ACTION_HOVER_EXIT event was not cleared.
     *   at androidx.compose.ui.platform.AndroidComposeView.sendHoverExitEvent
     *
     * Es un fallo conocido de Compose (issuetracker.google.com/issues/314269723) que se
     * dispara con ratón, lápiz, trackpad o teclado conectados al móvil, y también al
     * depurar con el ratón sobre el emulador.
     *
     * Se descarta únicamente ACTION_HOVER_EXIT cuando no hay ningún botón pulsado: ese
     * evento solo actualiza el resaltado de puntero, mientras que los toques reales
     * (ACTION_DOWN/UP) y el arrastre siguen llegando intactos a la interfaz.
     */
    override fun dispatchGenericMotionEvent(ev: MotionEvent): Boolean {
        if (ev.actionMasked == MotionEvent.ACTION_HOVER_EXIT && ev.buttonState == 0) {
            return true
        }
        return super.dispatchGenericMotionEvent(ev)
    }

    private companion object {
        const val TAB_CAPTURE = 0
        const val TAB_HISTORY = 1
    }
}
