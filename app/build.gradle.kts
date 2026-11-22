plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
}

android {
    namespace = "no.oystein.spillihuset"
    compileSdk = 36

    defaultConfig {
        applicationId = "no.oystein.spillihuset"
        minSdk = 26
        targetSdk = 36
        // Byggnummeret fra GitHub Actions, så hver ny APK har høyere versjon enn forrige.
        versionCode = System.getenv("GITHUB_RUN_NUMBER")?.toIntOrNull() ?: 1
        versionName = "1.0.${System.getenv("GITHUB_RUN_NUMBER") ?: "lokal"}"
    }

    // Fast nøkkel i repoet, så en ny APK kan installeres over den gamle uten å avinstallere.
    // Appen installeres bare direkte (ikke via Play), så nøkkelen er ikke hemmelig.
    signingConfigs {
        getByName("debug") {
            storeFile = file("debug.keystore")
            storePassword = "android"
            keyAlias = "androiddebugkey"
            keyPassword = "android"
        }
    }

    buildTypes {
        release {
            signingConfig = signingConfigs.getByName("debug")
            isMinifyEnabled = false
        }
    }

    // Spilldataene (dronemodell, terreng, teksturer) er allerede komprimert eller små tekstfiler
    androidResources {
        noCompress += listOf("jpg")
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }
}

kotlin {
    compilerOptions {
        jvmTarget.set(org.jetbrains.kotlin.gradle.dsl.JvmTarget.JVM_17)
    }
}

dependencies {
    implementation("androidx.core:core-ktx:1.15.0")
    implementation("androidx.webkit:webkit:1.12.1")
}
