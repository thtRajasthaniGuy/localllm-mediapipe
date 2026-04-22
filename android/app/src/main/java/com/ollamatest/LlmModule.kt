package com.ollamatest

import com.facebook.react.bridge.*
import com.google.mediapipe.tasks.genai.llminference.LlmInference
import com.google.mediapipe.tasks.genai.llminference.LlmInference.LlmInferenceOptions


class LlmModule(reactContext:ReactApplicationContext):ReactContextBaseJavaModule(reactContext){
    override fun getName() = "LlmModule"

    private var llm:LlmInference? = null

    @ReactMethod
fun loadModel(backend: String, promise: Promise){
    try{
        llm?.close()
        llm = null

        val modelPath = reactApplicationContext.assets.openFd("Gemma3-1B-IT.task")
        val cacheFile = java.io.File(reactApplicationContext.cacheDir,"Gemma3-1B-IT.task")

        if(!cacheFile.exists()){
            modelPath.createInputStream().use { input ->
                cacheFile.outputStream().use { output ->
                    input.copyTo(output)
                }
            }
        }

        val backendType = if (backend == "GPU") {
            LlmInference.Backend.GPU
        } else {
            LlmInference.Backend.CPU
        }

        val options = LlmInferenceOptions.builder()
            .setModelPath(cacheFile.absolutePath)
            .setMaxTokens(512)
            // .setTopK(10)
            // .setTemperature(0.9f)
            .setPreferredBackend(backendType)
            .build()

        llm = LlmInference.createFromOptions(reactApplicationContext, options)

        promise.resolve("loaded")

    }catch(e:Exception){
        promise.reject("LOAD_ERROR",e.message)
    }
}
@ReactMethod
fun unloadModel(promise: Promise){
    try{
        llm?.close()
        llm = null
        promise.resolve("unloaded")
    }catch(e:Exception){
        promise.reject("UNLOAD_ERROR", e.message)
    }
}

     @ReactMethod
    fun generate(prompt: String, promise: Promise) {
        try {
            val result = llm?.generateResponse(prompt)
            promise.resolve(result)
        } catch (e: Exception) {
            promise.reject("GEN_ERROR", e.message)
        }
    }
}