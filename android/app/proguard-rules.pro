# Reglas Proguard/R8 para Actas Digitales

# Anotaciones y metadatos conservados para reflexión
-keepattributes *Annotation*,Signature,InnerClasses,EnclosingMethod,SourceFile,LineNumberTable
-keepattributes RuntimeVisibleAnnotations,RuntimeVisibleParameterAnnotations
-keepattributes RuntimeInvisibleAnnotations,RuntimeInvisibleParameterAnnotations

# Gson: campos SerializedName y modelos de datos
-keepclassmembers class * {
    @com.google.gson.annotations.SerializedName <fields>;
}
-keep class com.google.gson.** { *; }
-keep class com.actasdigitales.app.data.model.** { *; }
-keep class com.actasdigitales.app.data.local.** { *; }
-keep class com.actasdigitales.app.data.api.** { *; }

# Retrofit + OkHttp + Okio
-keep class retrofit2.** { *; }
-keep interface retrofit2.** { *; }
-keep class okhttp3.** { *; }
-keep interface okhttp3.** { *; }
-keep class okio.** { *; }
-dontwarn okhttp3.**
-dontwarn retrofit2.**
-dontwarn okio.**

# Room: entidades, DAOs y base de datos (reflexión en el procesador KSP)
-keep class androidx.room.** { *; }
-keep @androidx.room.Entity class * { *; }
-keep @androidx.room.Dao interface * { *; }
-keepclassmembers class * {
    @androidx.room.* <fields>;
    @androidx.room.* <methods>;
    @androidx.room.* <init>(...);
}

# Coroutines (debug agent)
-dontwarn kotlinx.coroutines.debug.**

# Biometric / AndroidX
-dontwarn androidx.biometric.**

# Anotaciones JSR-305 (usadas por OkHttp)
-dontwarn javax.annotation.**
-keep class javax.annotation.** { *; }

# Kotlin metadata
-keep class kotlin.Metadata { *; }
-dontwarn kotlin.**
