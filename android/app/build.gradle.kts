plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
}

android {
    namespace = "com.lighthouse.tv"
    compileSdk = 36

    defaultConfig {
        applicationId = "com.lighthouse.tv"
        minSdk = 24
        targetSdk = 34
        versionCode = 1
        versionName = "1.0"

        // Where the API is and what to present to it. Both are read from the
        // build environment and handed to the page through ConfigBridge, because
        // the alternative is a settings screen typed on a D-pad.
        //
        // The token is deliberately not defaulted to anything usable: a build
        // that forgets it gets 401s and an app that says so, which is far easier
        // to diagnose than a build that quietly talks to the wrong server.
        buildConfigField(
            "String",
            "API_BASE_URL",
            "\"${System.getenv("LIGHTHOUSE_API_URL") ?: "http://10.0.2.2:3000"}\"",
        )
        buildConfigField(
            "String",
            "DEVICE_TOKEN",
            "\"${System.getenv("LIGHTHOUSE_DEVICE_TOKEN") ?: ""}\"",
        )
    }

    buildFeatures {
        buildConfig = true
    }

    buildTypes {
        release {
            isMinifyEnabled = false
        }
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }

    kotlinOptions {
        jvmTarget = "17"
    }
}
