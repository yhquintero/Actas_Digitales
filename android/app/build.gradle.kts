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
        // versionName/Code de la próxima build real (la app-release.apk comprometida es 1.0.0/1)
        versionCode = 2
        versionName = "1.3.0"

        testInstrumentationRunner = "androidx.test.runner.AndroidJUnitRunner"
        vectorDrawables {
            useSupportLibrary = true
        }
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
                storePassword = storePwd
                keyAlias = keyAliasName
                keyPassword = keyPwd
            }
        }
    }

    buildTypes {
        release {
            isMinifyEnabled = false
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
