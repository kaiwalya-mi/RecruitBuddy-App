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

// ===== PISTON API STRUCTURES =====

/**
 * Structures for interacting with the Piston API
 * Piston is a code execution engine that supports multiple languages
 */
#[derive(Serialize)]
struct PistonRequest {
    language: String,
    version: String,
    files: Vec<PistonFile>,
    stdin: String,
    args: Vec<String>,
    compile_timeout: u32,
    run_timeout: u32,
}

#[derive(Serialize)]
struct PistonFile {
    name: String,
    content: String,
}

#[derive(Deserialize, Debug)]
struct PistonResponse {
    language: String,
    version: String,
    run: PistonRun,
    compile: Option<PistonCompile>,
}

#[derive(Deserialize, Debug)]
struct PistonRun {
    stdout: String,
    stderr: String,
    output: String,
    code: i32,
    signal: Option<String>,
}

#[derive(Deserialize, Debug)]
struct PistonCompile {
    stdout: String,
    stderr: String,
    output: String,
    code: i32,
    signal: Option<String>,
}

// ===== CODE VALIDATION FUNCTIONS =====

/**
 * Validates Rust code by executing it with the Piston API
 * 
 * Returns a tuple of (score, execution_time, wrong_count)
 */
async fn validate_rust_code(code: &str) -> Result<(f32, f32, i32), Box<dyn std::error::Error>> {
    // Create a test wrapper around the submitted code
    let test_code = format!(
        r#"
        {}

        fn main() {{
            let result = sum(vec![1, 2, 3]);
            println!("{{}}", result);
        }}
        "#,
        code
    );

    // Create the request for the Piston API
    let client = reqwest::Client::new();
    let piston_req = PistonRequest {
        language: "rust".to_string(),
        version: "1.68.0".to_string(),
        files: vec![PistonFile {
            name: "main.rs".to_string(),
            content: test_code,
        }],
        stdin: "".to_string(),
        args: vec![],
        compile_timeout: 10000,
        run_timeout: 3000,
    };

    // Execute the code and measure time
    let start = std::time::Instant::now();
    let res = client
        .post("https://emkc.org/api/v2/piston/execute")
        .json(&piston_req)
        .send()
        .await?
        .json::<PistonResponse>()
        .await?;
    let duration = start.elapsed().as_secs_f32() * 1000.0; // Convert to ms

    // Check if the output is correct (should be 6)
    let output = res.run.output.trim();
    let is_correct = output == "6";
    let wrong_count = if is_correct { 0 } else { 1 };
    
    // Score is 92% if correct, 50% otherwise
    let score = if is_correct { 92.0 } else { 50.0 };
    
    Ok((score, duration, wrong_count))
}

/**
 * Validates TypeScript code by executing it with the Piston API
 * 
 * Returns a tuple of (score, execution_time, wrong_count)
 */
async fn validate_ts_code(code: &str) -> Result<(f32, f32, i32), Box<dyn std::error::Error>> {
    // Create a test wrapper around the submitted code
    let test_code = format!(
        r#"
        {}

        console.log(sum([1, 2, 3]));
        "#,
        code
    );

    // Create the request for the Piston API
    let client = reqwest::Client::new();
    let piston_req = PistonRequest {
        language: "typescript".to_string(),
        version: "5.0.3".to_string(),
        files: vec![PistonFile {
            name: "main.ts".to_string(),
            content: test_code,
        }],
        stdin: "".to_string(),
        args: vec![],
        compile_timeout: 10000,
        run_timeout: 3000,
    };

    // Execute the code and measure time
    let start = std::time::Instant::now();
    let res = client
        .post("https://emkc.org/api/v2/piston/execute")
        .json(&piston_req)
        .send()
        .await?
        .json::<PistonResponse>()
        .await?;
    let duration = start.elapsed().as_secs_f32() * 1000.0; // Convert to ms

    // Check if the output is correct (should be 6)
    let output = res.run.output.trim();
    let is_correct = output == "6";
    let wrong_count = if is_correct { 0 } else { 1 };
    
    // Score is 88% if correct, 50% otherwise
    let score = if is_correct { 88.0 } else { 50.0 };
    
    Ok((score, duration, wrong_count))
}