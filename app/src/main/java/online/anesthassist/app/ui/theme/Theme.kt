package online.anesthassist.app.ui.theme

import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Typography
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.runtime.Immutable
import androidx.compose.runtime.staticCompositionLocalOf
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.Font
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.sp
import online.anesthassist.app.R
import online.anesthassist.app.data.ThemePreference

val InterFontFamily = FontFamily(Font(R.font.inter, FontWeight.Normal))
val JetBrainsMonoFontFamily = FontFamily(Font(R.font.jetbrains_mono, FontWeight.Normal))

@Immutable
data class ClinicalColors(
    val isDark: Boolean,
    val bg: Color,
    val card: Color,
    val cardInset: Color,
    val border: Color,
    val borderLight: Color,
    val textPrimary: Color,
    val textSecondary: Color,
    val textMuted: Color,
    val cyan: Color,
    val cyanBg: Color,
    val cyanBorder: Color,
    val red: Color,
    val redBg: Color,
    val redBorder: Color,
    val emerald: Color,
    val emeraldBg: Color,
    val emeraldBorder: Color,
    val amber: Color,
    val amberBg: Color,
    val amberBorder: Color,
    val purple: Color,
    val purpleBg: Color,
    val purpleBorder: Color,
)

val DarkClinicalColors = ClinicalColors(
    isDark = true,
    bg = Color(0xFF090D16),
    card = Color(0xFF131B2E),
    cardInset = Color(0xFF0B1120),
    border = Color(0xFF1E293B),
    borderLight = Color(0xFF334155),
    textPrimary = Color(0xFFF1F5F9),
    textSecondary = Color(0xFFCBD5E1),
    textMuted = Color(0xFF94A3B8),
    cyan = Color(0xFF22D3EE),
    cyanBg = Color(0xFF083344),
    cyanBorder = Color(0xFF0E7490),
    red = Color(0xFFEF4444),
    redBg = Color(0xFF450A0A),
    redBorder = Color(0xFF991B1B),
    emerald = Color(0xFF10B981),
    emeraldBg = Color(0xFF022C22),
    emeraldBorder = Color(0xFF065F46),
    amber = Color(0xFFF59E0B),
    amberBg = Color(0xFF451A03),
    amberBorder = Color(0xFF92400E),
    purple = Color(0xFFC084FC),
    purpleBg = Color(0xFF2E1065),
    purpleBorder = Color(0xFF7E22CE),
)

val LightClinicalColors = ClinicalColors(
    isDark = false,
    bg = Color(0xFFF8FAFC),
    card = Color(0xFFFFFFFF),
    cardInset = Color(0xFFF1F5F9),
    border = Color(0xFFE2E8F0),
    borderLight = Color(0xFFCBD5E1),
    textPrimary = Color(0xFF0F172A),
    textSecondary = Color(0xFF334155),
    textMuted = Color(0xFF64748B),
    cyan = Color(0xFF0E7490),
    cyanBg = Color(0xFFECFEFF),
    cyanBorder = Color(0xFF67E8F9),
    red = Color(0xFFB91C1C),
    redBg = Color(0xFFFEF2F2),
    redBorder = Color(0xFFFCA5A5),
    emerald = Color(0xFF047857),
    emeraldBg = Color(0xFFECFDF5),
    emeraldBorder = Color(0xFF6EE7B7),
    amber = Color(0xFFB45309),
    amberBg = Color(0xFFFFFBEB),
    amberBorder = Color(0xFFFCD34D),
    purple = Color(0xFF7E22CE),
    purpleBg = Color(0xFFFAF5FF),
    purpleBorder = Color(0xFFD8B4FE),
)

val LocalClinicalColors = staticCompositionLocalOf { DarkClinicalColors }

private val DarkM3Scheme = darkColorScheme(
    primary = Color(0xFF06B6D4),
    onPrimary = Color(0xFF000000),
    secondary = Color(0xFF10B981),
    onSecondary = Color(0xFF000000),
    error = Color(0xFFEF4444),
    onError = Color(0xFFFFFFFF),
    background = Color(0xFF090D16),
    onBackground = Color(0xFFF1F5F9),
    surface = Color(0xFF131B2E),
    onSurface = Color(0xFFF1F5F9),
    surfaceVariant = Color(0xFF1E293B),
    onSurfaceVariant = Color(0xFF94A3B8),
    outline = Color(0xFF334155),
)

private val LightM3Scheme = lightColorScheme(
    primary = Color(0xFF0E7490),
    onPrimary = Color(0xFFFFFFFF),
    secondary = Color(0xFF047857),
    onSecondary = Color(0xFFFFFFFF),
    error = Color(0xFFB91C1C),
    onError = Color(0xFFFFFFFF),
    background = Color(0xFFF8FAFC),
    onBackground = Color(0xFF0F172A),
    surface = Color(0xFFFFFFFF),
    onSurface = Color(0xFF0F172A),
    surfaceVariant = Color(0xFFF1F5F9),
    onSurfaceVariant = Color(0xFF64748B),
    outline = Color(0xFFCBD5E1),
)

val AnesthTypography = Typography(
    headlineSmall = TextStyle(fontFamily = InterFontFamily, fontWeight = FontWeight.Black, fontSize = 20.sp, lineHeight = 26.sp),
    titleLarge = TextStyle(fontFamily = InterFontFamily, fontWeight = FontWeight.Bold, fontSize = 18.sp, lineHeight = 24.sp),
    titleMedium = TextStyle(fontFamily = InterFontFamily, fontWeight = FontWeight.Bold, fontSize = 15.sp, lineHeight = 20.sp),
    titleSmall = TextStyle(fontFamily = InterFontFamily, fontWeight = FontWeight.Bold, fontSize = 13.sp, lineHeight = 18.sp),
    bodyLarge = TextStyle(fontFamily = InterFontFamily, fontWeight = FontWeight.Normal, fontSize = 15.sp, lineHeight = 21.sp),
    bodyMedium = TextStyle(fontFamily = InterFontFamily, fontWeight = FontWeight.Normal, fontSize = 13.sp, lineHeight = 19.sp),
    bodySmall = TextStyle(fontFamily = InterFontFamily, fontWeight = FontWeight.Normal, fontSize = 11.sp, lineHeight = 16.sp),
    labelLarge = TextStyle(fontFamily = InterFontFamily, fontWeight = FontWeight.Bold, fontSize = 13.sp, lineHeight = 18.sp),
    labelMedium = TextStyle(fontFamily = InterFontFamily, fontWeight = FontWeight.Bold, fontSize = 11.sp, lineHeight = 15.sp),
    labelSmall = TextStyle(fontFamily = InterFontFamily, fontWeight = FontWeight.SemiBold, fontSize = 10.sp, lineHeight = 13.sp),
)

@Composable
fun AnesthAssistTheme(
    preference: ThemePreference = ThemePreference.SYSTEM,
    forceDark: Boolean = false,
    content: @Composable () -> Unit,
) {
    val dark = forceDark || when (preference) {
        ThemePreference.DARK -> true
        ThemePreference.LIGHT -> false
        ThemePreference.SYSTEM -> isSystemInDarkTheme()
    }
    val clinical = if (dark) DarkClinicalColors else LightClinicalColors
    val m3 = if (dark) DarkM3Scheme else LightM3Scheme
    CompositionLocalProvider(LocalClinicalColors provides clinical) {
        MaterialTheme(
            colorScheme = m3,
            typography = AnesthTypography,
            content = content,
        )
    }
}
