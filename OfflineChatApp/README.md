# Offline Chat (1-to-1, no internet, no server)

A minimal Android app where exactly two phones chat directly with each
other over Bluetooth/Wi-Fi using Google's **Nearby Connections API**.
There is no backend, no account system, and no internet requirement —
messages travel device-to-device only.

## How it works

1. One person taps **"Host (wait for partner)"** — their phone starts
   advertising itself.
2. The other person taps **"Join (find partner)"** — their phone scans
   for nearby advertisers and lists them.
3. Tapping the found name sends a connection request; once the host's
   phone auto-accepts, both devices open the chat screen.
4. `Strategy.P2P_POINT_TO_POINT` (in `NearbyHelper.kt`) caps each
   device to a single active connection, enforcing the 1:1 constraint
   at the transport level.
5. Messages are sent as raw byte payloads over the established link
   and appended to a RecyclerView chat bubble list.
6. Chat history is saved locally as JSON in the app's private storage
   (`filesDir/chat_history.json`) — nothing leaves the device, nothing
   touches a server.

## Requirements

- Android Studio (Koala or newer recommended)
- Two **physical Android devices** (min SDK 23 / Android 6.0+) —
  Nearby Connections does not work reliably on emulators, since it
  needs real Bluetooth/Wi-Fi radios
- Both devices need Google Play Services installed (standard on any
  phone with the Play Store)
- Bluetooth and Location turned ON on both phones (Nearby Connections
  uses Bluetooth/BLE/Wi-Fi under the hood and Android requires
  location permission to scan for them, even though no GPS location
  is actually used)

## Setup

1. Open the `OfflineChatApp` folder in Android Studio ("Open an
   existing project").
2. Let Gradle sync (it will download the Nearby Connections and Gson
   dependencies — this one-time sync needs internet; the app itself
   does not, once installed).
3. Build and install on both phones (`Run ▶` with each device
   selected, or build an APK via *Build > Build Bundle(s)/APK(s) >
   Build APK(s)* and share it directly, e.g. via Bluetooth/USB, since
   this is meant to be an offline-first app).
4. Grant the permission prompts on first launch (Bluetooth + nearby
   Wi-Fi + location — all required by Android for local discovery,
   not for GPS tracking).
5. On phone A tap **Host**; on phone B tap **Join** and tap phone A's
   name once it appears.

## Project structure

```
OfflineChatApp/
├── app/
│   ├── build.gradle              # dependencies (Nearby Connections, Gson)
│   └── src/main/
│       ├── AndroidManifest.xml   # permissions + activities
│       ├── java/com/example/offlinechat/
│       │   ├── MainActivity.kt   # host/join screen, permissions
│       │   ├── ChatActivity.kt   # message screen, local history
│       │   ├── NearbyHelper.kt   # Nearby Connections wrapper (the "transport")
│       │   ├── MessageAdapter.kt # chat bubble RecyclerView adapter
│       │   └── Message.kt        # message data model
│       └── res/
│           ├── layout/           # screens + bubble layouts
│           ├── drawable/         # bubble backgrounds
│           └── values/           # strings, theme
├── build.gradle
├── settings.gradle
└── gradle.properties
```

## Notes / things to harden before real use

- **Auto-accept:** `NearbyHelper.kt` currently auto-accepts every
  incoming connection request. For two trusted people this is fine,
  but for anything more sensitive, show
  `ConnectionInfo.authenticationDigits` on both screens and require
  the user to confirm they match before calling `acceptConnection`
  (this prevents a third nearby device from connecting instead).
- **Range:** Nearby Connections tops out at roughly 10–100m depending
  on which radio it falls back to (Bluetooth vs Wi-Fi Direct) — this
  is a proximity chat, not a long-distance one.
- **iOS:** This implementation is Android-only. Apple's equivalent
  (Multipeer Connectivity) is a different API and can't talk to
  Android's Nearby Connections directly — a cross-platform version
  would need a custom Bluetooth Low Energy (BLE) protocol instead.
- **No encryption layer added on top:** Nearby Connections encrypts
  the link itself, so this is reasonably private already, but no
  additional app-level encryption is layered on the stored JSON file.
