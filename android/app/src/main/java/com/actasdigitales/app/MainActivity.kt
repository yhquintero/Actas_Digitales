package com.actasdigitales.app

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.viewModels
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.History
import androidx.compose.material.icons.filled.Mic
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.runtime.saveable.rememberSaveable
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
            var selectedScreenTab by rememberSaveable { mutableIntStateOf(0) }

            ActasDigitalesTheme(themeMode = themeMode) {
                Scaffold(
                    modifier = Modifier.fillMaxSize(),
                    bottomBar = {
                        NavigationBar(
                            containerColor = MaterialTheme.colorScheme.surfaceVariant,
                            contentColor = MaterialTheme.colorScheme.primary
                        ) {
                            NavigationBarItem(
                                selected = selectedScreenTab == 0,
                                onClick = { selectedScreenTab = 0 },
                                icon = { Icon(Icons.Default.Mic, contentDescription = null) },
                                label = { Text("Captura", fontWeight = FontWeight.Bold) }
                            )
                            NavigationBarItem(
                                selected = selectedScreenTab == 1,
                                onClick = { selectedScreenTab = 1 },
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
                        when (selectedScreenTab) {
                            0 -> HomeScreen(
                                viewModel = viewModel,
                                themeMode = themeMode,
                                onThemeModeChange = { newMode -> themeMode = newMode }
                            )
                            1 -> HistoryScreen(
                                viewModel = viewModel,
                                themeMode = themeMode,
                                onThemeModeChange = { newMode -> themeMode = newMode }
                            )
                        }
                    }
                }
            }
        }
    }
}
