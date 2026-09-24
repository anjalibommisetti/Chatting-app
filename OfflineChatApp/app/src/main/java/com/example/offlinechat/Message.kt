package com.example.offlinechat

data class Message(
    val text: String,
    val isMine: Boolean,
    val timestamp: Long = System.currentTimeMillis()
)
