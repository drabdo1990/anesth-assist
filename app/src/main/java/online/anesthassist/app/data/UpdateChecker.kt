package online.anesthassist.app.data

import android.net.Uri
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable
import kotlinx.serialization.json.Json
import java.net.HttpURLConnection
import java.net.URL

sealed interface UpdateStatus {
    data object Idle : UpdateStatus
    data object Checking : UpdateStatus
    data class UpToDate(
        val currentVersion: String,
        val latestTag: String,
        val releaseUrl: String,
        val apkUrl: String?,
    ) : UpdateStatus
    data class UpdateAvailable(
        val currentVersion: String,
        val latestVersion: String,
        val releaseName: String,
        val notes: String,
        val downloadUrl: String,
        val isDirectApk: Boolean,
    ) : UpdateStatus
    data class NoReleases(
        val repo: String,
        val releasesPageUrl: String,
    ) : UpdateStatus
    data class Error(val message: String) : UpdateStatus
}

@Serializable
private data class GitHubAsset(
    val name: String = "",
    @SerialName("browser_download_url") val browserDownloadUrl: String = "",
)

@Serializable
private data class GitHubRelease(
    @SerialName("tag_name") val tagName: String = "",
    val name: String = "",
    val body: String = "",
    @SerialName("html_url") val htmlUrl: String = "",
    val assets: List<GitHubAsset> = emptyList(),
)

object UpdateChecker {
    private val json = Json { ignoreUnknownKeys = true }
    private val repoPattern = Regex("^[A-Za-z0-9_.-]+/[A-Za-z0-9_.-]+$")
    private val allowedHosts = setOf(
        "github.com",
        "objects.githubusercontent.com",
        "release-assets.githubusercontent.com",
    )

    fun normalizeRepo(raw: String): String {
        val trimmed = raw.trim()
            .removePrefix("https://github.com/")
            .removePrefix("http://github.com/")
            .removePrefix("github.com/")
            .removeSuffix(".git")
            .trim('/')
        return trimmed
    }

    fun isSafeGitHubUrl(rawUrl: String): Boolean {
        val uri = runCatching { Uri.parse(rawUrl) }.getOrNull() ?: return false
        val host = uri.host?.lowercase() ?: return false
        return uri.scheme.equals("https", ignoreCase = true) && host in allowedHosts
    }

    suspend fun checkLatestRelease(
        rawRepo: String,
        currentVersion: String,
    ): UpdateStatus = withContext(Dispatchers.IO) {
        val repo = normalizeRepo(rawRepo)
        if (!repoPattern.matches(repo)) {
            return@withContext UpdateStatus.Error("Enter a valid GitHub repository in owner/repo format (e.g. drabdo1990/anesth-helper).")
        }

        val releasesPage = "https://github.com/$repo/releases"
        val apiUrl = "https://api.github.com/repos/$repo/releases/latest"

        try {
            val conn = (URL(apiUrl).openConnection() as HttpURLConnection).apply {
                requestMethod = "GET"
                connectTimeout = 10_000
                readTimeout = 10_000
                setRequestProperty("Accept", "application/vnd.github+json")
                setRequestProperty("User-Agent", "AnesthAssist-Android/$currentVersion")
            }

            try {
                val code = conn.responseCode
                if (code == 404) {
                    return@withContext UpdateStatus.NoReleases(repo = repo, releasesPageUrl = releasesPage)
                }
                if (code == 403 || code == 429) {
                    return@withContext UpdateStatus.Error("GitHub rate limit reached. Try again later or open Releases in your browser.")
                }
                if (code !in 200..299) {
                    return@withContext UpdateStatus.Error("Could not check updates (HTTP $code).")
                }

                val body = conn.inputStream.bufferedReader().use { it.readText() }
                val release = json.decodeFromString<GitHubRelease>(body)
                val latestVersion = release.tagName.trim().removePrefix("v").removePrefix("V")
                val apkAsset = release.assets.firstOrNull {
                    it.name.endsWith(".apk", ignoreCase = true) && isSafeGitHubUrl(it.browserDownloadUrl)
                }
                val safeHtmlUrl = release.htmlUrl.takeIf { isSafeGitHubUrl(it) } ?: releasesPage
                val downloadUrl = apkAsset?.browserDownloadUrl ?: safeHtmlUrl

                if (compareSemver(latestVersion, currentVersion) > 0) {
                    UpdateStatus.UpdateAvailable(
                        currentVersion = currentVersion,
                        latestVersion = latestVersion.ifEmpty { release.tagName },
                        releaseName = release.name.ifBlank { release.tagName },
                        notes = release.body.trim().take(400),
                        downloadUrl = downloadUrl,
                        isDirectApk = apkAsset != null,
                    )
                } else {
                    UpdateStatus.UpToDate(
                        currentVersion = currentVersion,
                        latestTag = release.tagName.ifBlank { "v$currentVersion" },
                        releaseUrl = safeHtmlUrl,
                        apkUrl = apkAsset?.browserDownloadUrl,
                    )
                }
            } finally {
                conn.disconnect()
            }
        } catch (e: Exception) {
            UpdateStatus.Error("Offline or network unavailable: ${e.localizedMessage ?: "check connection"}.")
        }
    }

    internal fun compareSemver(remote: String, local: String): Int {
        val rParts = parseVersionParts(remote)
        val lParts = parseVersionParts(local)
        val maxLen = maxOf(rParts.size, lParts.size)
        for (i in 0 until maxLen) {
            val rv = rParts.getOrElse(i) { 0 }
            val lv = lParts.getOrElse(i) { 0 }
            if (rv != lv) return rv.compareTo(lv)
        }
        return 0
    }

    private fun parseVersionParts(version: String): List<Int> {
        val core = version.trim().removePrefix("v").removePrefix("V").substringBefore('-')
        return core.split('.').mapNotNull { it.toIntOrNull() }
    }
}
