plugins {
    alias(libs.plugins.android.application)
    alias(libs.plugins.kotlin.compose)
    alias(libs.plugins.ksp)
}

android {
    namespace = "com.actasdigitales.app"
    compileSdk = 35

    defaultConfig {
        applicationId = "com.actasdigitales.app"
        minSdk = 26
        targetSdk = 34
        // Versionado: por defecto 1.3.0/2 (la app-release.apk comprometida es 1.0.0/1).
        // El workflow de release inyecta la versión del tag (ACTAS_VERSION_NAME sin la "v")
        // y el número de ejecución de CI como versionCode.
        versionCode = (System.getenv("ACTAS_VERSION_CODE") ?: "2").toInt()
        versionName = System.getenv("ACTAS_VERSION_NAME") ?: "1.3.0"

        testInstrumentationRunner = "androidx.test.runner.AndroidJUnitRunner"
        vectorDrawables {
            useSupportLibrary = true
        }
        // Certificate pinning opcional (opt-in, ver RetrofitClient): vacío por defecto
        buildConfigField("String", "ACTAS_CERT_PIN_PRIMARY", "\"${System.getenv("ACTAS_CERT_PIN_PRIMARY") ?: ""}\"")
        buildConfigField("String", "ACTAS_CERT_PIN_BACKUP", "\"${System.getenv("ACTAS_CERT_PIN_BACKUP") ?: ""}\"")
    }

    signingConfigs {
        create("release") {
            // Clave persistente fuera de Git (android/signing/ está ignorado).
            // Generarla con: keytool -genkey -v -keystore android/signing/actas-mobile.keystore \
            //   -alias actas-mobile -keyalg RSA -keysize 4096 -validity 3650
            // y exportar ACTAS_KEYSTORE_PATH/PASSWORD/KEY_ALIAS/KEY_PASSWORD en CI o local.
            val storePath = System.getenv("ACTAS_KEYSTORE_PATH") ?: rootProject.file("signing/actas-mobile.keystore").absolutePath
            val storePwd = System.getenv("ACTAS_KEYSTORE_PASSWORD") ?: ""
            val keyAliasName = System.getenv("ACTAS_KEY_ALIAS") ?: "actas-mobile"
            val keyPwd = System.getenv("ACTAS_KEY_PASSWORD") ?: storePwd
            if (file(storePath).exists() && storePwd.isNotEmpty()) {
                storeFile = file(storePath)
                storeType = if (System.getenv("ACTAS_KEYSTORE_TYPE") ?: "") {
                    System.getenv("ACTAS_KEYSTORE_TYPE")
                } else if (storePath.endsWith(".p12") || storePath.endsWith(".pfx")) {
                    "pkcs12"
                } else {
                    "pkcs12" // el almacén persistente del proyecto es PKCS12 (android/signing/actas-mobile.keystore)
                }
                storePassword = storePwd
                keyAlias = keyAliasName
                keyPassword = keyPwd
            }
        }
    }

    buildTypes {
        release {
            // R8: reduce el tamaño del APK (13 MB -> ~6-8 MB) y elimina código muerto.
            // Las reglas en proguard-rules.pro conservan Retrofit/Gson/Room/modelos.
            isMinifyEnabled = true
            isShrinkResources = true
            proguardFiles(
                getDefaultProguardFile("proguard-android-optimize.txt"),
                "proguard-rules.pro"
            )
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
    buildFeatures {
        compose = true
        buildConfig = true // Requerido para las BuildConfig fields (pins TLS)
    }
    // Splits por ABI: paquetes más pequeños por arquitectura. isUniversalApk mantiene
    // un APK universal (el que distribuye la Web/GitHub Releases) con todas las ABIs.
    splits {
        abi {
            isEnable = true
            reset()
            include("arm64-v8a", "armeabi-v7a", "x86_64")
            isUniversalApk = true
        }
    }
    packaging {
        resources {
            excludes += "/META-INF/{AL2.0,LGPL2.1}"
        }
    }
    lint {
        // No bloquear assembleRelease por la descarga de las herramientas de lint.
        // Ejecuta `./gradlew lintRelease` aparte cuando quieras el análisis completo.
        checkReleaseBuilds = false
    }
}

dependencies {
    // Core Android & Lifecycle
    implementation(libs.androidx.core.ktx)
    implementation(libs.androidx.lifecycle.runtime.ktx)
    implementation(libs.androidx.lifecycle.viewmodel.compose)
    implementation(libs.androidx.activity.compose)
    implementation(libs.androidx.biometric)

    // Jetpack Compose & Material 3
    implementation(platform(libs.androidx.compose.bom))
    implementation(libs.androidx.compose.ui)
    implementation(libs.androidx.compose.ui.graphics)
    implementation(libs.androidx.compose.ui.tooling.preview)
    implementation(libs.androidx.compose.material3)
    implementation(libs.androidx.compose.material.icons.extended)
    implementation(libs.androidx.navigation.compose)

    // WorkManager (para subidas resilientes en segundo plano)
    implementation(libs.androidx.work.runtime.ktx)

    // Room Database (Persistencia Local de Actas Digitales)
    implementation(libs.androidx.room.runtime)
    implementation(libs.androidx.room.ktx)
    ksp(libs.androidx.room.compiler)

    // Networking (Retrofit + OkHttp + Moshi/Gson)
    implementation(libs.retrofit.core)
    implementation(libs.retrofit.converter.gson)
    implementation(libs.okhttp.core)
    implementation(libs.okhttp.logging.interceptor)

    // Coroutines
    implementation(libs.kotlinx.coroutines.android)

    // Debugging
    debugImplementation(libs.androidx.compose.ui.tooling)
    debugImplementation(libs.androidx.compose.ui.testmanifest)
}
