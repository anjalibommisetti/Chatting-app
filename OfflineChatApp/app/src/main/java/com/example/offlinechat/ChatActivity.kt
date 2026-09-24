package com.example.offlinechat

import android.os.Bundle
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import androidx.recyclerview.widget.LinearLayoutManager
import com.example.offlinechat.databinding.ActivityChatBinding
import com.google.gson.Gson
import com.google.gson.reflect.TypeToken
import java.io.File

class ChatActivity : AppCompatActivity() {

    private lateinit var binding: ActivityChatBinding
    private lateinit var adapter: MessageAdapter
    private val messages = mutableListOf<Message>()
    private val gson = Gson()

    // Local-only persistence - a plain file on this device, no server involved
    private val historyFile: File by lazy { File(filesDir, "chat_history.json") }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityChatBinding.inflate(layoutInflater)
        setContentView(binding.root)

        loadHistory()

        adapter = MessageAdapter(messages)
        binding.messageList.layoutManager = LinearLayoutManager(this).apply {
            stackFromEnd = true
        }
        binding.messageList.adapter = adapter
        scrollToBottom()

        binding.sendButton.setOnClickListener { sendCurrentInput() }

        NearbyHelper.onMessageReceived = { text ->
            runOnUiThread {
                addMessage(Message(text = text, isMine = false))
            }
        }

        NearbyHelper.onDisconnected = {
            runOnUiThread {
                Toast.makeText(this, "The other device disconnected", Toast.LENGTH_LONG).show()
                finish()
            }
        }
    }

    private fun sendCurrentInput() {
        val text = binding.messageInput.text.toString().trim()
        if (text.isEmpty()) return

        NearbyHelper.sendMessage(text)
        addMessage(Message(text = text, isMine = true))
        binding.messageInput.text.clear()
    }

    private fun addMessage(message: Message) {
        messages.add(message)
        adapter.notifyItemInserted(messages.size - 1)
        scrollToBottom()
        saveHistory()
    }

    private fun scrollToBottom() {
        if (messages.isNotEmpty()) {
            binding.messageList.scrollToPosition(messages.size - 1)
        }
    }

    private fun loadHistory() {
        if (!historyFile.exists()) return
        runCatching {
            val json = historyFile.readText()
            val type = object : TypeToken<List<Message>>() {}.type
            val saved: List<Message> = gson.fromJson(json, type)
            messages.addAll(saved)
        }
    }

    private fun saveHistory() {
        runCatching {
            historyFile.writeText(gson.toJson(messages))
        }
    }

    override fun onDestroy() {
        super.onDestroy()
        NearbyHelper.onMessageReceived = null
    }
}
