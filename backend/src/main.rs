use actix_cors::Cors;
use actix_web::{web, App, HttpResponse, HttpServer, Responder};
use chrono::{DateTime, Utc};
use dotenv::dotenv;
use serde::{Deserialize, Serialize};
use std::env;
use std::sync::Mutex;
use std::vec::Vec;
use tokio_postgres::{Client, NoTls};
use uuid::Uuid;

// ===== DATA STRUCTURES =====

/**
 * AppState - In-memory storage for our application
 * 
 * For simplicity, we're using in-memory storage with Mutex for thread safety.
 * In a production app, we would use a proper database.
 */
struct AppState {
    submissions: Mutex<Vec<Submission>>,
    recruiter_inputs: Mutex<Vec<RecruiterInput>>,
    db_client: Option<Client>,
}

/**
 * Submission - Represents a candidate's code submission
 * 
 * Stores code, scores, execution times, and error counts for
 * Rust and TypeScript challenges, plus AI knowledge assessment.
 */
#[derive(Serialize, Deserialize, Clone)]
struct Submission {
    id: String,
    rust_code: String,
    ts_code: String,
    ai_answer: String,
    rust_score: f32,
    ts_score: f32,
    ai_score: f32,
    rust_time: f32,
    ts_time: f32,
    rust_wrong: i32,
    ts_wrong: i32,
    created_at: DateTime<Utc>,
}

/**
 * RecruiterInput - Stores custom questions from recruiters
 * 
 * Includes both free-text questions and multiple-choice questions
 * with options and correct answers.
 */
#[derive(Serialize, Deserialize, Clone)]
struct RecruiterInput {
    id: String,
    custom_question: String,
    mcq_question: String,
    mcq_options: Vec<String>,
    mcq_correct: String,
    created_at: DateTime<Utc>,
}

// ===== REQUEST/RESPONSE STRUCTURES =====

/**
 * SubmissionRequest - Data sent from frontend for code submission
 */
#[derive(Deserialize)]
struct SubmissionRequest {
    rust_code: String,
    ts_code: String,
    ai_answer: String,
}

/**
 * RecruiterRequest - Data sent from frontend for custom questions
 */
#[derive(Deserialize)]
struct RecruiterRequest {
    custom_question: String,
    mcq_question: String,
    mcq_options: Vec<String>,
    mcq_correct: String,
}