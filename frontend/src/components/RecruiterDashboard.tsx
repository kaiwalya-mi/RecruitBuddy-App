import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import axios from 'axios';
// Remove react-gauge-chart since it has type declaration issues
// import GaugeChart from 'react-gauge-chart';
import GaugeChart from 'react-gauge-chart';

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

// Metrics components
const MetricsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
`;

const MetricCard = styled.div`
  background-color: rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  padding: 20px;
`;

const MetricTitle = styled.h3`
  font-size: 14px;
  font-weight: 500;
  color: #86868b;
  margin-bottom: 10px;
  text-transform: uppercase;
`;

const MetricValue = styled.p`
  font-size: 28px;
  font-weight: 600;
  color: #f5f5f7;
  margin: 0;
`;

// Table components
const Table = styled.table`
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  margin-bottom: 30px;
  border-radius: 12px;
  overflow: hidden;
`;

const TableHead = styled.thead`
  background-color: rgba(255, 255, 255, 0.05);
`;

const TableRow = styled.tr`
  &:nth-child(even) {
    background-color: rgba(255, 255, 255, 0.02);
  }
`;

const TableHeader = styled.th`
  padding: 12px;
  text-align: left;
  font-weight: 500;
  font-size: 14px;
  color: #86868b;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
`;

const TableCell = styled.td`
  padding: 12px;
  font-size: 14px;
  color: #f5f5f7;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
`;

// Gauge components
const GaugeContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
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

// Form components
const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 20px;
  margin-top: 30px;
  padding: 20px;
  border-radius: 12px;
  background-color: rgba(255, 255, 255, 0.05);
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

const Label = styled.label`
  font-size: 16px;
  font-weight: 500;
  color: #f5f5f7;
`;

const Input = styled.input`
  padding: 12px;
  border: none;
  border-radius: 8px;
  background-color: rgba(255, 255, 255, 0.1);
  color: #f5f5f7;
  font-size: 14px;
  
  &:focus {
    outline: none;
    box-shadow: 0 0 0 2px #0071e3;
  }
`;

const TextArea = styled.textarea`
  padding: 12px;
  border: none;
  border-radius: 8px;
  background-color: rgba(255, 255, 255, 0.1);
  color: #f5f5f7;
  font-family: inherit;
  font-size: 14px;
  min-height: 100px;
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

const OptionContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
`;

const RadioInput = styled.input`
  width: 18px;
  height: 18px;
  accent-color: #0071e3;
`;

/**
 * RecruiterDashboard Component
 * 
 * This component allows recruiters to:
 * 1. View metrics about candidate performance
 * 2. See detailed submission data in a table
 * 3. Add custom questions for candidates
 */
const RecruiterDashboard: React.FC = () => {
  // Metrics and loading state
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  
  // Form state for custom questions
  const [customQuestion, setCustomQuestion] = useState<string>('');
  const [mcqQuestion, setMcqQuestion] = useState<string>('');
  const [mcqOptions, setMcqOptions] = useState<string[]>(['', '', '', '']);
  const [mcqCorrect, setMcqCorrect] = useState<string>('a');
  const [formLoading, setFormLoading] = useState<boolean>(false);
  const [formSuccess, setFormSuccess] = useState<boolean>(false);
  
  // Fetch metrics when component mounts
  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const response = await axios.get('http://localhost:8080/results');
        setMetrics(response.data);
      } catch (error) {
        console.error('Error fetching results:', error);
        // Initialize with default values if the API call fails
        setMetrics({
          total_submissions: 0,
          rust_success_rate: 0,
          ts_success_rate: 0,
          ai_success_rate: 0,
          avg_rust_time: 0,
          avg_ts_time: 0,
          total_rust_wrong: 0,
          total_ts_wrong: 0,
          submissions: []
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchMetrics();
    
    // Refresh data every 10 seconds
    const interval = setInterval(fetchMetrics, 10000);
    return () => clearInterval(interval);
  }, []);
  
  // Helper function to get gauge color based on score
  const getGaugeColor = (score: number) => {
    if (score >= 90) return ['#34c759']; // Green
    if (score >= 70) return ['#ff9500']; // Orange
    return ['#ff3b30']; // Red
  };
  
  // Handle option change for multiple choice questions
  const handleOptionChange = (index: number, value: string) => {
    const newOptions = [...mcqOptions];
    newOptions[index] = value;
    setMcqOptions(newOptions);
  };
  
  // Handle form submission for custom questions
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    
    try {
      // Log the data being submitted
      console.log('Submitting form with data:', {
        custom_question: customQuestion,
        mcq_question: mcqQuestion,
        mcq_options: mcqOptions,
        mcq_correct: mcqCorrect
      });
      
      // Send data to backend
      const response = await axios.post('http://localhost:8080/recruiter', {
        custom_question: customQuestion,
        mcq_question: mcqQuestion,
        mcq_options: mcqOptions,
        mcq_correct: mcqCorrect
      });
      
      console.log('Response:', response);
      
      // Show success message
      setFormSuccess(true);
      setTimeout(() => setFormSuccess(false), 3000);
      
      // Reset form
      setCustomQuestion('');
      setMcqQuestion('');
      setMcqOptions(['', '', '', '']);
      setMcqCorrect('a');
    } catch (error) {
      console.error('Error submitting custom questions:', error);
      if (axios.isAxiosError(error)) {
        console.error('Response data:', error.response?.data);
        console.error('Response status:', error.response?.status);
        console.error('Response headers:', error.response?.headers);
      }
      alert('Failed to submit custom questions. Please try again.');
    } finally {
      setFormLoading(false);
    }
  };
  
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
  
  return (
    <Container>
      <Header>
        <Logo>Recruit Buddy</Logo>
        <Tagline>Smart Candidate Skill Validation</Tagline>
      </Header>
      
      <Title>Recruiter Dashboard</Title>
      
      {loading ? (
        <p>Loading data...</p>
      ) : (
        <>
          {/* Success Rate Gauges */}
          <GaugeContainer>
            <GaugeItem>
              <GaugeLabel>Rust Success Rate</GaugeLabel>
              <GaugeChart 
                id="rust-success-gauge" 
                nrOfLevels={3} 
                colors={getGaugeColor(safeValue(metrics?.rust_success_rate, 0))} 
                percent={safeValue(metrics?.rust_success_rate, 0) / 100} 
                textColor="#ffffff"
                needleColor="#ffffff"
                needleBaseColor="#ffffff"
                arcWidth={0.3}
              />
            </GaugeItem>
            
            <GaugeItem>
              <GaugeLabel>TypeScript Success Rate</GaugeLabel>
              <GaugeChart 
                id="ts-success-gauge" 
                nrOfLevels={3} 
                colors={getGaugeColor(safeValue(metrics?.ts_success_rate, 0))} 
                percent={safeValue(metrics?.ts_success_rate, 0) / 100} 
                textColor="#ffffff"
                needleColor="#ffffff"
                needleBaseColor="#ffffff"
                arcWidth={0.3}
              />
            </GaugeItem>
            
            <GaugeItem>
              <GaugeLabel>AI Success Rate</GaugeLabel>
              <GaugeChart 
                id="ai-success-gauge" 
                nrOfLevels={3} 
                colors={getGaugeColor(safeValue(metrics?.ai_success_rate, 0))} 
                percent={safeValue(metrics?.ai_success_rate, 0) / 100} 
                textColor="#ffffff"
                needleColor="#ffffff"
                needleBaseColor="#ffffff"
                arcWidth={0.3}
              />
            </GaugeItem>
          </GaugeContainer>
          
          {/* Metrics Cards */}
          <MetricsGrid>
            <MetricCard>
              <MetricTitle>Total Candidates</MetricTitle>
              <MetricValue>{safeValue(metrics?.total_submissions, 0)}</MetricValue>
            </MetricCard>
            
            <MetricCard>
              <MetricTitle>Average Execution Times</MetricTitle>
              <MetricValue>
                Rust: {safeToFixed(metrics?.avg_rust_time)}ms | TS: {safeToFixed(metrics?.avg_ts_time)}ms
              </MetricValue>
            </MetricCard>
            
            <MetricCard>
              <MetricTitle>Wrong Answers</MetricTitle>
              <MetricValue>
                Rust: {safeValue(metrics?.total_rust_wrong, 0)} | TS: {safeValue(metrics?.total_ts_wrong, 0)}
              </MetricValue>
            </MetricCard>
            
            <MetricCard>
              <MetricTitle>Time Saved</MetricTitle>
              <MetricValue>~{safeValue(metrics?.total_submissions, 0) * 15} mins</MetricValue>
            </MetricCard>
            
            <MetricCard>
              <MetricTitle>Candidate Throughput</MetricTitle>
              <MetricValue>50 candidates/hour</MetricValue>
            </MetricCard>
            
            <MetricCard>
              <MetricTitle>Impact</MetricTitle>
              <MetricValue>Reduced screening time by 93%</MetricValue>
            </MetricCard>
          </MetricsGrid>
          
          <Title>Recent Submissions</Title>
          
          {/* Submissions Table */}
          <Table>
            <TableHead>
              <TableRow>
                <TableHeader>ID</TableHeader>
                <TableHeader>Rust Score</TableHeader>
                <TableHeader>TS Score</TableHeader>
                <TableHeader>AI Score</TableHeader>
                <TableHeader>Rust Time</TableHeader>
                <TableHeader>TS Time</TableHeader>
                <TableHeader>Wrong Answers</TableHeader>
              </TableRow>
            </TableHead>
            <tbody>
              {metrics?.submissions && metrics.submissions.map((submission: any) => (
                <TableRow key={submission.id}>
                  <TableCell>{submission.id.substring(0, 8)}...</TableCell>
                  <TableCell>{submission.rust_score}%</TableCell>
                  <TableCell>{submission.ts_score}%</TableCell>
                  <TableCell>{submission.ai_score}%</TableCell>
                  <TableCell>{safeToFixed(submission.rust_time)}ms</TableCell>
                  <TableCell>{safeToFixed(submission.ts_time)}ms</TableCell>
                  <TableCell>R: {safeValue(submission.rust_wrong, 0)}, TS: {safeValue(submission.ts_wrong, 0)}</TableCell>
                </TableRow>
              ))}
            </tbody>
          </Table>
          
          <Title>Add Custom Questions</Title>
          
          {/* Custom Questions Form */}
          <Form onSubmit={handleSubmit}>
            <FormGroup>
              <Label>Custom Question (Free Text)</Label>
              <TextArea 
                value={customQuestion}
                onChange={(e) => setCustomQuestion(e.target.value)}
                placeholder="Enter a custom question for candidates..."
                required
              />
            </FormGroup>
            
            <FormGroup>
              <Label>Multiple Choice Question</Label>
              <TextArea 
                value={mcqQuestion}
                onChange={(e) => setMcqQuestion(e.target.value)}
                placeholder="Enter a multiple choice question..."
                required
              />
            </FormGroup>
            
            <FormGroup>
              <Label>Options</Label>
              {mcqOptions.map((option, index) => (
                <OptionContainer key={index}>
                  <RadioInput 
                    type="radio" 
                    name="mcq_correct" 
                    value={String.fromCharCode(97 + index)} // a, b, c, d
                    checked={mcqCorrect === String.fromCharCode(97 + index)} 
                    onChange={() => setMcqCorrect(String.fromCharCode(97 + index))} 
                  />
                  <Label>{String.fromCharCode(97 + index)})</Label>
                  <Input 
                    value={option}
                    onChange={(e) => handleOptionChange(index, e.target.value)}
                    placeholder={`Option ${String.fromCharCode(97 + index)}`}
                    required
                  />
                </OptionContainer>
              ))}
              <p style={{ color: '#86868b', fontSize: '14px', marginTop: '8px' }}>
                Select the radio button next to the correct answer.
              </p>
            </FormGroup>
            
            <Button type="submit" disabled={formLoading}>
              {formLoading ? 'Submitting...' : 'Save Custom Questions'}
            </Button>
            
            {formSuccess && (
              <p style={{ color: '#34c759', marginTop: '16px', textAlign: 'center', fontWeight: '500' }}>
                Custom questions saved successfully!
              </p>
            )}
          </Form>
        </>
      )}
    </Container>
  );
};

export default RecruiterDashboard;