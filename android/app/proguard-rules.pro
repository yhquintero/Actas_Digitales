# Reglas Proguard para Actas Digitales
-keepattributes *Annotation*
-keepclassmembers class * {
    @com.google.gson.annotations.SerializedName <fields>;
}
-keep class com.actasdigitales.app.data.model.** { *; }
-dontwarn okhttp3.**
-dontwarn retrofit2.**
