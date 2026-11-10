package com.actasdigitales.app.data.api

import com.actasdigitales.app.data.model.JobResponse
import okhttp3.MultipartBody
import okhttp3.RequestBody
import retrofit2.Response
import retrofit2.http.*

interface ActasApiService {

    @Multipart
    @POST("api/audio/upload")
    suspend fun uploadAudio(
        @Part file: MultipartBody.Part,
        @Part("language") language: RequestBody,
        @Header("X-API-Key") apiKey: String? = null
    ): Response<JobResponse>

    @GET("api/audio/jobs/{job_id}")
    suspend fun getJobStatus(
        @Path("job_id") jobId: String
    ): Response<JobResponse>

    @GET("api/audio/jobs")
    suspend fun listRecentJobs(
        @Query("limit") limit: Int = 10
    ): Response<List<JobResponse>>
}
