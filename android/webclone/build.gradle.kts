// :webclone — «clon Web» del servidor en Android: app mínima WebView que carga
// la interfaz web del servidor Actas Digitales (la misma que se sirve en /).
// Sin Compose ni AndroidX: una Activity + WebView, para minimizar superficie
// y dependencias. El servidor se cambia desde el menú (persistente en
// SharedPreferences) o con ACTAS_WEB_URL en tiempo de compilación.
plugins {
    alias(libs.plugins.android.application)
}

android {
    namespace = "com.actasdigitales.webclone"
    compileSdk = 35

    defaultConfig {
        applicationId = "com.actasdigitales.webclone"
        minSdk = 26
        targetSdk = 34
        versionCode = (System.getenv("ACTAS_VERSION_CODE") ?: "2").toInt()
        versionName = System.getenv("ACTAS_VERSION_NAME") ?: "1.6.0"

        buildConfigField("String", "ACTAS_WEB_URL", "\"${System.getenv("ACTAS_WEB_URL") ?: "https://10.0.2.2:8443/"}\"")
    }

    signingConfigs {
        create("release") {
            // Misma clave persistente que :app (android/signing/ está ignorado por Git).
            val storePath = System.getenv("ACTAS_KEYSTORE_PATH") ?: rootProject.file("signing/actas-mobile.keystore").absolutePath
            val storePwd = System.getenv("ACTAS_KEYSTORE_PASSWORD") ?: ""
            val keyAliasName = System.getenv("ACTAS_KEY_ALIAS") ?: "actas-mobile"
            val keyPwd = System.getenv("ACTAS_KEY_PASSWORD") ?: storePwd
            if (file(storePath).exists() && storePwd.isNotEmpty()) {
                storeFile = file(storePath)
                storeType = System.getenv("ACTAS_KEYSTORE_TYPE")?.takeIf { it.isNotBlank() } ?: "pkcs12"
                storePassword = storePwd
                keyAlias = keyAliasName
                keyPassword = keyPwd
            }
        }
    }

    buildFeatures {
        buildConfig = true
    }

    buildTypes {
        release {
            isMinifyEnabled = false  // app mínima: sin R8; el APK ronda los 40 KB
            val hasReleaseKey = signingConfigs.getByName("release").storeFile != null
            if (hasReleaseKey) {
                signingConfig = signingConfigs.getByName("release")
            }
        }
    }
    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }
}
