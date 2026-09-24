package com.example.offlinechat

import android.content.Context
import com.google.android.gms.nearby.Nearby
import com.google.android.gms.nearby.connection.AdvertisingOptions
import com.google.android.gms.nearby.connection.ConnectionInfo
import com.google.android.gms.nearby.connection.ConnectionLifecycleCallback
import com.google.android.gms.nearby.connection.ConnectionResolution
import com.google.android.gms.nearby.connection.ConnectionsClient
import com.google.android.gms.nearby.connection.ConnectionsStatusCodes
import com.google.android.gms.nearby.connection.DiscoveredEndpointInfo
import com.google.android.gms.nearby.connection.DiscoveryOptions
import com.google.android.gms.nearby.connection.EndpointDiscoveryCallback
import com.google.android.gms.nearby.connection.Payload
import com.google.android.gms.nearby.connection.PayloadCallback
import com.google.android.gms.nearby.connection.PayloadTransferUpdate
import com.google.android.gms.nearby.connection.Strategy
import java.nio.charset.StandardCharsets

/**
 * Wraps Google's Nearby Connections API for a strictly 1-to-1, offline
 * (no internet, no server) chat link between two devices.
 *
 * Strategy.P2P_POINT_TO_POINT enforces exactly one active connection per
 * device, which is exactly what a 1:1 chat needs.
 */
object NearbyHelper {

    // Must match between both devices/builds - identifies your app's "channel"
    private const val SERVICE_ID = "com.example.offlinechat.SERVICE_ID"
    private val STRATEGY = Strategy.P2P_POINT_TO_POINT

    private lateinit var connectionsClient: ConnectionsClient

    var connectedEndpointId: String? = null
        private set

    // Callbacks the Activities hook into
    var onEndpointFound: ((endpointId: String, name: String) -> Unit)? = null
    var onConnected: ((endpointId: String) -> Unit)? = null
    var onConnectionFailed: (() -> Unit)? = null
    var onDisconnected: (() -> Unit)? = null
    var onMessageReceived: ((text: String) -> Unit)? = null

    fun init(context: Context) {
        connectionsClient = Nearby.getConnectionsClient(context.applicationContext)
    }

    // ---- Host side: makes this device discoverable ----
    fun startAdvertising(deviceName: String) {
        val options = AdvertisingOptions.Builder().setStrategy(STRATEGY).build()
        connectionsClient.startAdvertising(
            deviceName,
            SERVICE_ID,
            connectionLifecycleCallback,
            options
        )
    }

    // ---- Joiner side: looks for a device advertising ----
    fun startDiscovery() {
        val options = DiscoveryOptions.Builder().setStrategy(STRATEGY).build()
        connectionsClient.startDiscovery(
            SERVICE_ID,
            endpointDiscoveryCallback,
            options
        )
    }

    fun requestConnection(myName: String, endpointId: String) {
        connectionsClient.requestConnection(myName, endpointId, connectionLifecycleCallback)
    }

    fun stopAdvertising() = connectionsClient.stopAdvertising()
    fun stopDiscovery() = connectionsClient.stopDiscovery()

    fun disconnect() {
        connectedEndpointId?.let { connectionsClient.disconnectFromEndpoint(it) }
        connectedEndpointId = null
        connectionsClient.stopAllEndpoints()
    }

    fun sendMessage(text: String) {
        val endpointId = connectedEndpointId ?: return
        val payload = Payload.fromBytes(text.toByteArray(StandardCharsets.UTF_8))
        connectionsClient.sendPayload(endpointId, payload)
    }

    private val endpointDiscoveryCallback = object : EndpointDiscoveryCallback() {
        override fun onEndpointFound(endpointId: String, info: DiscoveredEndpointInfo) {
            onEndpointFound?.invoke(endpointId, info.endpointName)
        }

        override fun onEndpointLost(endpointId: String) {
            // No-op: UI simply won't list it any more on next scan
        }
    }

    private val connectionLifecycleCallback = object : ConnectionLifecycleCallback() {
        override fun onConnectionInitiated(endpointId: String, info: ConnectionInfo) {
            // Auto-accept: fine for a simple 1:1 personal app.
            // For extra safety you could show info.authenticationDigits
            // on both screens and require the user to confirm it matches.
            connectionsClient.acceptConnection(endpointId, payloadCallback)
        }

        override fun onConnectionResult(endpointId: String, result: ConnectionResolution) {
            if (result.status.statusCode == ConnectionsStatusCodes.STATUS_OK) {
                connectedEndpointId = endpointId
                stopAdvertising()
                stopDiscovery()
                onConnected?.invoke(endpointId)
            } else {
                onConnectionFailed?.invoke()
            }
        }

        override fun onDisconnected(endpointId: String) {
            connectedEndpointId = null
            onDisconnected?.invoke()
        }
    }

    private val payloadCallback = object : PayloadCallback() {
        override fun onPayloadReceived(endpointId: String, payload: Payload) {
            if (payload.type == Payload.Type.BYTES) {
                val bytes = payload.asBytes() ?: return
                val text = String(bytes, StandardCharsets.UTF_8)
                onMessageReceived?.invoke(text)
            }
        }

        override fun onPayloadTransferUpdate(endpointId: String, update: PayloadTransferUpdate) {
            // No-op for simple text payloads (they complete in one shot)
        }
    }
}
