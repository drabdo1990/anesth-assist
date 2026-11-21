# Keep kotlinx.serialization generated serializers
-keepattributes *Annotation*, InnerClasses
-dontnote kotlinx.serialization.AnnotationsKt
-keepclassmembers class kotlinx.serialization.json.** {
    *** Companion;
}
-keepclasseswithmembers class kotlinx.serialization.json.** {
    kotlinx.serialization.KSerializer serializer(...);
}
-keep,includedescriptorclasses class online.anesthassist.app.data.**$$serializer { *; }
-keepclassmembers class online.anesthassist.app.data.** {
    *** Companion;
}
-keepclasseswithmembers class online.anesthassist.app.data.** {
    kotlinx.serialization.KSerializer serializer(...);
}
