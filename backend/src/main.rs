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

/**
 * Validates AI knowledge answer
 * 
 * Simple check for the correct answer to the AI framework question
 */
fn validate_ai_answer(answer: &str) -> f32 {
    // Correct answer is "b" for Hugging Face
    if answer.trim().to_lowercase() == "b" {
        92.0
    } else {
        50.0
    }
}

// ===== API ENDPOINTS =====

/**
 * POST /submit - Handles code submissions from candidates
 * 
 * Validates Rust and TypeScript code, calculates scores,
 * and stores the submission.
 */
async fn submit(
    data: web::Data<AppState>,
    submission: web::Json<SubmissionRequest>,
) -> impl Responder {
    // Validate the code and calculate scores
    let rust_result = match validate_rust_code(&submission.rust_code).await {
        Ok((score, time, wrong)) => (score, time, wrong),
        Err(_) => (50.0, 0.0, 1), // Default values if validation fails
    };
    
    let ts_result = match validate_ts_code(&submission.ts_code).await {
        Ok((score, time, wrong)) => (score, time, wrong),
        Err(_) => (50.0, 0.0, 1), // Default values if validation fails
    };
    
    let ai_score = validate_ai_answer(&submission.ai_answer);
    
    // Create a new submission
    let new_submission = Submission {
        id: Uuid::new_v4().to_string(),
        rust_code: submission.rust_code.clone(),
        ts_code: submission.ts_code.clone(),
        ai_answer: submission.ai_answer.clone(),
        rust_score: rust_result.0,
        ts_score: ts_result.0,
        ai_score,
        rust_time: rust_result.1,
        ts_time: ts_result.1,
        rust_wrong: rust_result.2,
        ts_wrong: ts_result.2,
        created_at: Utc::now(),
    };
    
    // Add the submission to our in-memory storage
    data.submissions.lock().unwrap().push(new_submission.clone());
    
    // Return the results
    HttpResponse::Ok().json(new_submission)
}

/**
 * GET /results - Retrieves metrics and submissions for the recruiter dashboard
 * 
 * Calculates success rates, average times, and error counts
 */
async fn results(data: web::Data<AppState>) -> impl Responder {
    let submissions = data.submissions.lock().unwrap();
    
    // Calculate metrics
    let total_submissions = submissions.len();
    let mut rust_success = 0;
    let mut ts_success = 0;
    let mut ai_success = 0;
    let mut total_rust_time = 0.0;
    let mut total_ts_time = 0.0;
    let mut total_rust_wrong = 0;
    let mut total_ts_wrong = 0;
    
    for submission in submissions.iter() {
        if submission.rust_score > 90.0 {
            rust_success += 1;
        }
        if submission.ts_score > 85.0 {
            ts_success += 1;
        }
        if submission.ai_score > 90.0 {
            ai_success += 1;
        }
        total_rust_time += submission.rust_time;
        total_ts_time += submission.ts_time;
        total_rust_wrong += submission.rust_wrong;
        total_ts_wrong += submission.ts_wrong;
    }
    
    // Create metrics response
    let metrics = serde_json::json!({
        "total_submissions": total_submissions,
        "rust_success_rate": if total_submissions > 0 { (rust_success as f32 / total_submissions as f32) * 100.0 } else { 0.0 },
        "ts_success_rate": if total_submissions > 0 { (ts_success as f32 / total_submissions as f32) * 100.0 } else { 0.0 },
        "ai_success_rate": if total_submissions > 0 { (ai_success as f32 / total_submissions as f32) * 100.0 } else { 0.0 },
        "avg_rust_time": if total_submissions > 0 { total_rust_time / total_submissions as f32 } else { 0.0 },
        "avg_ts_time": if total_submissions > 0 { total_ts_time / total_submissions as f32 } else { 0.0 },
        "total_rust_wrong": total_rust_wrong,
        "total_ts_wrong": total_ts_wrong,
        "submissions": &*submissions,
    });
    
    HttpResponse::Ok().json(metrics)
}

/**
 * POST /recruiter - Handles custom question submissions from recruiters
 * 
 * Stores the custom questions for candidates to see
 */
async fn recruiter_input(
    data: web::Data<AppState>,
    input: web::Json<RecruiterRequest>,
) -> impl Responder {
    // Create a new recruiter input
    let new_input = RecruiterInput {
        id: Uuid::new_v4().to_string(),
        custom_question: input.custom_question.clone(),
        mcq_question: input.mcq_question.clone(),
        mcq_options: input.mcq_options.clone(),
        mcq_correct: input.mcq_correct.clone(),
        created_at: Utc::now(),
    };
    
    // Add the input to our in-memory storage (only keep the most recent)
    let mut inputs = data.recruiter_inputs.lock().unwrap();
    inputs.clear(); // We only keep the most recent input
    inputs.push(new_input.clone());
    
    // Return the results
    HttpResponse::Ok().json(new_input)
}

/**
 * GET /recruiter - Retrieves the most recent custom questions
 * 
 * Used by the candidate portal to display custom questions
 */
async fn get_recruiter_input(data: web::Data<AppState>) -> impl Responder {
    let inputs = data.recruiter_inputs.lock().unwrap();
    
    if inputs.is_empty() {
        HttpResponse::Ok().json(serde_json::json!({
            "has_custom": false,
            "input": null
        }))
    } else {
        HttpResponse::Ok().json(serde_json::json!({
            "has_custom": true,
            "input": &inputs[0]
        }))
    }
}

/**
 * Main function - Sets up and starts the web server
 */
#[actix_web::main]
async fn main() -> std::io::Result<()> {
    // Load environment variables
    dotenv().ok();
    
    // Initialize logger
    env_logger::init_from_env(env_logger::Env::new().default_filter_or("info"));
    
    // Create app state with in-memory storage
    let app_state = web::Data::new(AppState {
        submissions: Mutex::new(Vec::new()),
        recruiter_inputs: Mutex::new(Vec::new()),
        db_client: None,
    });
    
    println!("Starting server at http://localhost:8080");
    
    // Start HTTP server
    HttpServer::new(move || {
        // Configure CORS to allow requests from the frontend
        let cors = Cors::default()
            .allow_any_origin()
            .allow_any_method()
            .allow_any_header();
        
        App::new()
            .wrap(cors)
            .app_data(app_state.clone())
            .route("/submit", web::post().to(submit))
            .route("/results", web::get().to(results))
            .route("/recruiter", web::post().to(recruiter_input))
            .route("/recruiter", web::get().to(get_recruiter_input))
    })
    .bind("0.0.0.0:8080")?
    .run()
    .await
}