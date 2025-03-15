# RecruitBuddy Frontend

<div align="center">
  <img src="https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/React-61DAFB?style=for-the-badge&logo=react&logoColor=black" alt="React" />
  <img src="https://img.shields.io/badge/Styled_Components-DB7093?style=for-the-badge&logo=styled-components&logoColor=white" alt="Styled Components" />
  <img src="https://img.shields.io/badge/Axios-5A29E4?style=for-the-badge&logo=axios&logoColor=white" alt="Axios" />
</div>

## Overview

The RecruitBuddy frontend is a modern, responsive web application built with React and TypeScript. It provides an intuitive interface for both candidates and recruiters, featuring real-time code execution, performance visualization, and a sleek Apple-inspired dark mode design.

## Tech Stack

- **React 18**: For building a component-based UI with efficient rendering
- **TypeScript**: For type safety and improved developer experience
- **Styled Components**: For component-scoped styling with dynamic theming
- **React Router**: For client-side routing between candidate and recruiter views
- **Axios**: For making HTTP requests to the backend API
- **React Gauge Chart**: For visualizing performance metrics

## Key Features

### Candidate Portal

- **Code Submission**: Interactive code editors for Rust and TypeScript
- **AI Knowledge Assessment**: Multiple-choice questions with instant feedback
- **Custom Questions**: Dynamic rendering of recruiter-provided questions
- **Performance Visualization**: Gauge charts showing performance metrics
- **Responsive Design**: Works seamlessly on desktop and mobile devices

### Recruiter Dashboard

- **Performance Metrics**: Real-time visualization of candidate performance
- **Submission History**: Tabular view of all candidate submissions
- **Custom Question Creation**: Interface for creating tailored questions
- **Data Visualization**: Gauge charts for success rates across languages

## Component Architecture

The frontend follows a modular component architecture:

```
frontend/
├── src/
│   ├── components/
│   │   ├── CandidatePortal.tsx    # Candidate-facing interface
│   │   └── RecruiterDashboard.tsx # Recruiter-facing interface
│   ├── utils/
│   │   └── pistonClient.ts        # Code execution service
│   ├── App.tsx                    # Main application component
│   └── index.tsx                  # Application entry point
└── package.json                   # Dependencies and scripts
```

## Performance Optimizations

- **Memoization**: React.memo and useMemo for expensive calculations
- **Lazy Loading**: Components loaded only when needed
- **Efficient Rendering**: Minimizing unnecessary re-renders
- **Type Safety**: TypeScript interfaces to prevent runtime errors

## Styling Approach

The UI follows Apple's design language with:

- **Dark Mode**: High-contrast dark theme for reduced eye strain
- **Minimalist Design**: Clean interfaces with focused content areas
- **Responsive Layouts**: Grid and flexbox for adaptive layouts
- **Consistent Components**: Reusable styled components for UI consistency

## Code Execution

Code execution is handled through the Piston API:

```typescript
export const executeRustCode = async (code: string): Promise<any> => {
  try {
    // Create a wrapper to test the sum function
    const testCode = `
      ${code}

      fn main() {
        let result = sum(vec![1, 2, 3]);
        println!("{}", result);
      }
    `;

    // Execute with retry logic for rate limiting
    let attempts = 0;
    let result;
    
    while (attempts < 3) {
      try {
        if (attempts > 0) {
          await delay(300 * attempts);
        }
        
        result = await pistonClient.execute('rust', testCode);
        
        if (result && result.run) {
          break;
        }
      } catch (error) {
        console.log(`Attempt ${attempts + 1} failed:`, error);
      }
      
      attempts++;
    }
    
    // Validate output and calculate score
    const output = result.run.stdout.trim();
    const isCorrect = output === '6';
    const score = isCorrect ? 92.0 : 50.0;
    
    return {
      score,
      time: 0.2,
      wrongCount: isCorrect ? 0 : 1,
      output
    };
  } catch (error) {
    console.error('Error executing Rust code:', error);
    return {
      score: 50.0,
      time: 0.2,
      wrongCount: 1,
      output: 'Error executing code'
    };
  }
};
```

## Getting Started

### Prerequisites

- Node.js 16+ and npm

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm start

# Build for production
npm run build
```

### Docker Deployment

```bash
# Build the Docker image
docker build -t recruitbuddy-frontend .

# Run the container
docker run -p 3000:80 recruitbuddy-frontend
```

## Development Roadmap

- [ ] Add unit and integration tests with Jest and Testing Library
- [ ] Implement more advanced code editor features
- [ ] Add dark/light theme toggle
- [ ] Integrate with CI/CD pipeline
- [ ] Add internationalization support