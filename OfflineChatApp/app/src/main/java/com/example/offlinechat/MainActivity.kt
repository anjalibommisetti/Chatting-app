package com.example.offlinechat

import android.Manifest
import android.content.Intent
import android.os.Build
import android.os.Bundle
import android.widget.ArrayAdapter
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import androidx.activity.result.contract.ActivityResultContracts
import com.example.offlinechat.databinding.ActivityMainBinding

class MainActivity : AppCompatActivity() {

    private lateinit var binding: ActivityMainBinding

    // endpointId -> display name, for the "join" list
    private val foundEndpoints = LinkedHashMap<String, String>()
    private lateinit var foundNamesAdapter: ArrayAdapter<String>

    private var myName: String = "Phone-${(1000..9999).random()}"

    private val permissionLauncher = registerForActivityResult(
        ActivityResultContracts.RequestMultiplePermissions()
    ) { results ->
        if (results.values.all { it }) {
            Toast.makeText(this, "Permissions granted", Toast.LENGTH_SHORT).show()
        } else {
            Toast.makeText(
                this,
                "All permissions are required for offline discovery to work",
                Toast.LENGTH_LONG
            ).show()
        }
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityMainBinding.inflate(layoutInflater)
        setContentView(binding.root)

        NearbyHelper.init(this)

        binding.myNameInput.setText(myName)
        foundNamesAdapter = ArrayAdapter(this, android.R.layout.simple_list_item_1, mutableListOf())
        binding.foundList.adapter = foundNamesAdapter

        requestRequiredPermissions()

        binding.hostButton.setOnClickListener { startHosting() }
        binding.joinButton.setOnClickListener { startJoining() }

        binding.foundList.setOnItemClickListener { _, _, position, _ ->
            val endpointId = foundEndpoints.keys.toList()[position]
            NearbyHelper.requestConnection(currentName(), endpointId)
            binding.statusText.text = "Connecting..."
        }

        setNearbyCallbacks()
    }

    private fun currentName(): String = binding.myNameInput.text.toString().ifBlank { myName }

    private fun setNearbyCallbacks() {
        NearbyHelper.onEndpointFound = { endpointId, name ->
            runOnUiThread {
                if (!foundEndpoints.containsKey(endpointId)) {
                    foundEndpoints[endpointId] = name
                    foundNamesAdapter.clear()
                    foundNamesAdapter.addAll(foundEndpoints.values)
                    foundNamesAdapter.notifyDataSetChanged()
                }
            }
        }

        NearbyHelper.onConnected = { _ ->
            runOnUiThread {
                binding.statusText.text = "Connected!"
                startActivity(Intent(this, ChatActivity::class.java))
            }
        }

        NearbyHelper.onConnectionFailed = {
            runOnUiThread {
                binding.statusText.text = "Connection failed. Try again."
            }
        }

        NearbyHelper.onDisconnected = {
            runOnUiThread {
                binding.statusText.text = "Disconnected"
            }
        }
    }

    private fun startHosting() {
        binding.statusText.text = "Waiting for the other device to join..."
        NearbyHelper.startAdvertising(currentName())
    }

    private fun startJoining() {
        binding.statusText.text = "Searching for nearby device..."
        foundEndpoints.clear()
        foundNamesAdapter.clear()
        NearbyHelper.startDiscovery()
    }

    private fun requestRequiredPermissions() {
        val permissions = mutableListOf(
            Manifest.permission.ACCESS_FINE_LOCATION,
            Manifest.permission.ACCESS_COARSE_LOCATION
        )
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            permissions.add(Manifest.permission.BLUETOOTH_ADVERTISE)
            permissions.add(Manifest.permission.BLUETOOTH_CONNECT)
            permissions.add(Manifest.permission.BLUETOOTH_SCAN)
        }
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            permissions.add(Manifest.permission.NEARBY_WIFI_DEVICES)
        }
        permissionLauncher.launch(permissions.toTypedArray())
    }

    override fun onDestroy() {
        super.onDestroy()
        NearbyHelper.stopAdvertising()
        NearbyHelper.stopDiscovery()
    }
}
