import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import axios from 'axios';
import GaugeChart from 'react-gauge-chart';
import { executeRustCode, executeTypeScriptCode } from '../utils/pistonClient';

// Simple styled components with clear names
const Container = styled.div`
  background-color: #000;
  color: #f5f5f7;
  padding: 30px;
  max-width: 1000px;
  margin: 0 auto;
`;

const Header = styled.header`
  text-align: center;
  margin-bottom: 40px;
`;

const Logo = styled.h1`
  font-size: 36px;
  font-weight: 600;
  margin: 0;
  background: linear-gradient(90deg, #007aff, #5ac8fa);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
`;

const Tagline = styled.p`
  font-size: 18px;
  color: #86868b;
  margin-top: 10px;
`;

const Title = styled.h2`
  font-size: 24px;
  font-weight: 600;
  margin-bottom: 20px;
  color: #f5f5f7;
  text-align: center;
`;

// Form components
const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 20px;
`;

const FormGroup = styled.div`
  background-color: rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

const Label = styled.label`
  font-size: 16px;
  font-weight: 500;
  color: #f5f5f7;
`;

const TextArea = styled.textarea`
  padding: 15px;
  border: none;
  border-radius: 8px;
  background-color: rgba(255, 255, 255, 0.1);
  color: #f5f5f7;
  font-family: 'SF Mono', monospace;
  font-size: 14px;
  min-height: 120px;
  resize: vertical;
  
  &:focus {
    outline: none;
    box-shadow: 0 0 0 2px #0071e3;
  }
`;

const Button = styled.button`
  background-color: #0071e3;
  color: white;
  border: none;
  border-radius: 8px;
  padding: 12px 24px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  align-self: center;
  
  &:disabled {
    background-color: #555;
    cursor: not-allowed;
  }
`;

// Radio button components
const RadioGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

const RadioOption = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
`;

const RadioInput = styled.input`
  width: 18px;
  height: 18px;
  accent-color: #0071e3;
`;

const RadioLabel = styled.label`
  font-size: 16px;
  color: #f5f5f7;
`;

// Results components
const ResultsContainer = styled.div`
  background-color: rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  padding: 25px;
  margin-top: 30px;
`;

const ResultsTitle = styled.h3`
  font-size: 20px;
  font-weight: 600;
  margin-bottom: 20px;
  color: #f5f5f7;
  text-align: center;
`;

const ResultsText = styled.div`
  font-size: 16px;
  line-height: 1.5;
  color: #f5f5f7;
  margin-bottom: 25px;
  background-color: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  padding: 15px;
`;

const GaugeContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
`;

const GaugeItem = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  background-color: rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  padding: 15px;
`;

const GaugeLabel = styled.p`
  font-size: 16px;
  font-weight: 500;
  margin-bottom: 10px;
  color: #f5f5f7;
`;

// Interface for recruiter input
interface RecruiterInput {
  custom_question: string;
  mcq_question: string;
  mcq_options: string[];
  mcq_correct: string;
}

/**
 * CandidatePortal Component
 * 
 * This component allows candidates to:
 * 1. Submit Rust and TypeScript code solutions
 * 2. Answer AI knowledge questions
 * 3. Answer custom questions from recruiters
 * 4. View their results with visual gauges
 */
const CandidatePortal: React.FC = () => {
  // Form state
  const [rustCode, setRustCode] = useState<string>('');
  const [tsCode, setTsCode] = useState<string>('');
  const [aiAnswer, setAiAnswer] = useState<string>('');
  const [customAnswer, setCustomAnswer] = useState<string>('');
  
  // Results and loading state
  const [results, setResults] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(false);
  
  // Recruiter custom questions state
  const [recruiterInput, setRecruiterInput] = useState<RecruiterInput | null>(null);
  const [hasCustomQuestion, setHasCustomQuestion] = useState<boolean>(false);
  
  // Fetch recruiter input when component mounts
  useEffect(() => {
    const fetchRecruiterInput = async () => {
      try {
        const response = await axios.get('http://localhost:8080/recruiter');
        if (response.data.has_custom) {
          setRecruiterInput(response.data.input);
          setHasCustomQuestion(true);
        }
      } catch (error) {
        console.error('Error fetching recruiter input:', error);
      }
    };
    
    fetchRecruiterInput();
  }, []);
  
  // Helper function to safely format numbers
  const safeToFixed = (value: any, digits: number = 2) => {
    if (value === undefined || value === null) {
      return '0.00';
    }
    return Number(value).toFixed(digits);
  };
  
  // Helper function to safely get a number value with a default
  const safeValue = (value: any, defaultValue: number = 0) => {
    return value !== undefined && value !== null ? value : defaultValue;
  };
  
  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      // Execute code using Piston API
      const [rustResult, tsResult] = await Promise.all([
        executeRustCode(rustCode),
        executeTypeScriptCode(tsCode)
      ]);
      
      // Validate AI answer (correct answer is 'b' - Hugging Face)
      const aiScore = aiAnswer.trim().toLowerCase() === 'b' ? 92.0 : 50.0;
      
      // Create results object
      const submissionResults = {
        id: Math.random().toString(36).substring(2, 15),
        rust_code: rustCode,
        ts_code: tsCode,
        ai_answer: aiAnswer,
        rust_score: rustResult.score,
        ts_score: tsResult.score,
        ai_score: aiScore,
        rust_time: rustResult.time,
        ts_time: tsResult.time,
        rust_wrong: rustResult.wrongCount,
        ts_wrong: tsResult.wrongCount,
        created_at: new Date().toISOString()
      };
      
      // Store the results locally
      setResults(submissionResults);
      
      // Send to backend for storage
      await axios.post('http://localhost:8080/submit', {
        rust_code: rustCode,
        ts_code: tsCode,
        ai_answer: aiAnswer,
        custom_answer: customAnswer
      });
    } catch (error) {
      console.error('Error submitting code:', error);
      alert('Failed to submit code. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  // Helper function to get gauge color based on score
  const getGaugeColor = (score: number) => {
    if (score >= 90) return ['#34c759']; // Green
    if (score >= 70) return ['#ff9500']; // Orange
    return ['#ff3b30']; // Red
  };
  
  return (
    <Container>
      <Header>
        <Logo>Recruit Buddy</Logo>
        <Tagline>Your AI-powered recruitment assistant</Tagline>
      </Header>
      
      <Title>Candidate Skill Validation</Title>
      
      <Form onSubmit={handleSubmit}>
        {/* Rust Code Challenge */}
        <FormGroup>
          <Label>Rust Code Challenge</Label>
          <TextArea 
            value={rustCode}
            onChange={(e) => setRustCode(e.target.value)}
            placeholder="Write a function that sums all elements in an array: fn sum(arr: Vec<i32>) -> i32"
            required
          />
        </FormGroup>
        
        {/* TypeScript Code Challenge */}
        <FormGroup>
          <Label>TypeScript Code Challenge</Label>
          <TextArea 
            value={tsCode}
            onChange={(e) => setTsCode(e.target.value)}
            placeholder="Write a function that sums all elements in an array: function sum(arr: number[]): number"
            required
          />
        </FormGroup>
        
        {/* AI Framework Knowledge */}
        <FormGroup>
          <Label>AI Framework Knowledge</Label>
          <p>Which is best for NLP?</p>
          <RadioGroup>
            <RadioOption>
              <RadioInput 
                type="radio" 
                name="ai_answer" 
                value="a" 
                checked={aiAnswer === 'a'} 
                onChange={() => setAiAnswer('a')} 
                required 
              />
              <RadioLabel>a) TensorFlow</RadioLabel>
            </RadioOption>
            
            <RadioOption>
              <RadioInput 
                type="radio" 
                name="ai_answer" 
                value="b" 
                checked={aiAnswer === 'b'} 
                onChange={() => setAiAnswer('b')} 
              />
              <RadioLabel>b) Hugging Face</RadioLabel>
            </RadioOption>
            
            <RadioOption>
              <RadioInput 
                type="radio" 
                name="ai_answer" 
                value="c" 
                checked={aiAnswer === 'c'} 
                onChange={() => setAiAnswer('c')} 
              />
              <RadioLabel>c) PyTorch</RadioLabel>
            </RadioOption>
            
            <RadioOption>
              <RadioInput 
                type="radio" 
                name="ai_answer" 
                value="d" 
                checked={aiAnswer === 'd'} 
                onChange={() => setAiAnswer('d')} 
              />
              <RadioLabel>d) RustAI</RadioLabel>
            </RadioOption>
          </RadioGroup>
        </FormGroup>
        
        {/* Custom Recruiter Questions (if available) */}
        {hasCustomQuestion && recruiterInput && (
          <>
            <FormGroup>
              <Label>Custom Question from Recruiter</Label>
              <p>{recruiterInput.custom_question}</p>
              <TextArea 
                value={customAnswer}
                onChange={(e) => setCustomAnswer(e.target.value)}
                placeholder="Your answer here..."
                required
              />
            </FormGroup>
            
            <FormGroup>
              <Label>{recruiterInput.mcq_question}</Label>
              <RadioGroup>
                {recruiterInput.mcq_options.map((option, index) => (
                  <RadioOption key={index}>
                    <RadioInput 
                      type="radio" 
                      name="custom_mcq" 
                      value={String.fromCharCode(97 + index)} // a, b, c, d...
                      checked={customAnswer === String.fromCharCode(97 + index)} 
                      onChange={() => setCustomAnswer(String.fromCharCode(97 + index))} 
                      required 
                    />
                    <RadioLabel>{String.fromCharCode(97 + index)}) {option}</RadioLabel>
                  </RadioOption>
                ))}
              </RadioGroup>
            </FormGroup>
          </>
        )}
        
        {/* Submit Button */}
        <Button type="submit" disabled={loading}>
          {loading ? 'Submitting...' : 'Submit'}
        </Button>
      </Form>
      
      {/* Results Section */}
      {results && (
        <ResultsContainer>
          <ResultsTitle>Your Results</ResultsTitle>
          <ResultsText>
            Rust: {results.rust_score}%, {safeToFixed(results.rust_time)}ms, {safeValue(results.rust_wrong, 0)} wrong | 
            TS: {results.ts_score}%, {safeToFixed(results.ts_time)}ms, {safeValue(results.ts_wrong, 0)} wrong | 
            AI: {results.ai_score}%
          </ResultsText>
          
          <GaugeContainer>
            {/* Rust Score Gauge */}
            <GaugeItem>
              <GaugeLabel>Rust Score</GaugeLabel>
              <GaugeChart 
                id="rust-gauge" 
                nrOfLevels={3} 
                colors={getGaugeColor(safeValue(results.rust_score, 0))} 
                percent={safeValue(results.rust_score, 0) / 100} 
                textColor="#ffffff"
                needleColor="#ffffff"
                needleBaseColor="#ffffff"
                arcWidth={0.3}
              />
            </GaugeItem>
            
            {/* TypeScript Score Gauge */}
            <GaugeItem>
              <GaugeLabel>TypeScript Score</GaugeLabel>
              <GaugeChart 
                id="ts-gauge" 
                nrOfLevels={3} 
                colors={getGaugeColor(safeValue(results.ts_score, 0))} 
                percent={safeValue(results.ts_score, 0) / 100} 
                textColor="#ffffff"
                needleColor="#ffffff"
                needleBaseColor="#ffffff"
                arcWidth={0.3}
              />
            </GaugeItem>
            
            {/* AI Knowledge Gauge */}
            <GaugeItem>
              <GaugeLabel>AI Knowledge</GaugeLabel>
              <GaugeChart 
                id="ai-gauge" 
                nrOfLevels={3} 
                colors={getGaugeColor(safeValue(results.ai_score, 0))} 
                percent={safeValue(results.ai_score, 0) / 100} 
                textColor="#ffffff"
                needleColor="#ffffff"
                needleBaseColor="#ffffff"
                arcWidth={0.3}
              />
            </GaugeItem>
          </GaugeContainer>
        </ResultsContainer>
      )}
    </Container>
  );
};

export default CandidatePortal;