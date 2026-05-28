import java.util.Properties

plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
}

android {
    namespace = "io.github.haroldroot.saysay"
    compileSdk = 34

    defaultConfig {
        applicationId = "io.github.haroldroot.saysay"
        minSdk = 26
        targetSdk = 34
        versionCode = 2
        versionName = "1.0.1"
    }

    signingConfigs {
        val keystorePropertiesFile = rootProject.file("keystore.properties")
        if (keystorePropertiesFile.exists()) {
            val keystoreProperties = Properties()
            val inputStream = keystorePropertiesFile.inputStream()
            keystoreProperties.load(inputStream)
            inputStream.close()

            create("release") {
                val storeFileRelativePath = keystoreProperties["storeFile"] as String
                // storeFile is relative to the directory containing keystore.properties (android/)
                storeFile = rootProject.file(storeFileRelativePath)
                storePassword = keystoreProperties["storePassword"] as String
                keyAlias = keystoreProperties["keyAlias"] as String
                keyPassword = keystoreProperties["keyPassword"] as String
            }
        }
    }

    buildTypes {
        release {
            if (signingConfigs.findByName("release") != null) {
                signingConfig = signingConfigs.getByName("release")
            }
            isMinifyEnabled = true
            isShrinkResources = true
            proguardFiles(
                getDefaultProguardFile("proguard-android-optimize.txt"),
                "proguard-rules.pro"
            )
        }
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }

    kotlinOptions {
        jvmTarget = "17"
    }

    buildFeatures {
        buildConfig = false
    }
}

dependencies {
    implementation("com.google.android.material:material:1.12.0")
    implementation("androidx.core:core-ktx:1.13.1")
    implementation("androidx.activity:activity-ktx:1.9.2")
    implementation("androidx.webkit:webkit:1.11.0")
}

// Copy web assets from the repo root into the app's assets/web/ directory at
// build time. The web project remains the single source of truth — these files
// are not committed under android/ (see top-level .gitignore).
val webAssetsDir = layout.projectDirectory.dir("src/main/assets/web")

val copyWebAssets = tasks.register<Copy>("copyWebAssets") {
    val repoRoot = rootProject.projectDir.parentFile
    from(repoRoot) {
        include("index.html", "app.js", "mapping.json", "LICENSE")
    }
    into(webAssetsDir)
}

tasks.named("preBuild") {
    dependsOn(copyWebAssets)
}

tasks.named<Delete>("clean") {
    delete(webAssetsDir)
}
