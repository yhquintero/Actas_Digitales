plugins {
    alias(libs.plugins.android.application) apply false
    // AGP 9 incluye Kotlin integrado (built-in Kotlin): no se aplica org.jetbrains.kotlin.android.
    alias(libs.plugins.kotlin.compose) apply false
    alias(libs.plugins.ksp) apply false
}
