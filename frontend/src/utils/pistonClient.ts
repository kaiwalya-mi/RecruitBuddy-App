import piston from 'piston-client';

/**
 * Piston Client Utility
 * 
 * This module provides functions to execute code using the Piston API.
 * Piston is a code execution engine that supports multiple languages.
 */

// Create a singleton instance of the Piston client
const pistonClient = piston({ server: "https://emkc.org" });

// Helper function to add delay between requests to avoid rate limiting
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Execute Rust code and evaluate the result
 * 
 * @param code - The Rust code to execute (should contain a sum function)
 * @returns Object containing score, execution time, wrong answer count, and output
 */
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

    // Execute the code with retry logic for rate limiting
    let attempts = 0;
    let result;
    
    while (attempts < 3) {
      try {
        // Add delay to avoid rate limiting
        if (attempts > 0) {
          await delay(300 * attempts); // Increase delay with each retry
        }
        
        result = await pistonClient.execute('rust', testCode);
        
        // If we get a result with a run property, we're good
        if (result && result.run) {
          break;
        }
      } catch (error) {
        console.log(`Attempt ${attempts + 1} failed:`, error);
      }
      
      attempts++;
    }
    
    // If we still don't have a valid result, return default values
    if (!result || !result.run) {
      return {
        score: 50.0,
        time: 0.2,
        wrongCount: 1,
        output: 'Error executing code due to rate limiting'
      };
    }
    
    // Check if the output is correct (should be 6)
    const output = result.run.stdout.trim();
    const isCorrect = output === '6';
    
    // Score is 92% if correct, 50% otherwise
    const score = isCorrect ? 92.0 : 50.0;
    const wrongCount = isCorrect ? 0 : 1;
    
    return {
      score,
      time: 0.2, // Simplified for demo
      wrongCount,
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

/**
 * Execute TypeScript code and evaluate the result
 * 
 * @param code - The TypeScript code to execute (should contain a sum function)
 * @returns Object containing score, execution time, wrong answer count, and output
 */
export const executeTypeScriptCode = async (code: string): Promise<any> => {
  try {
    // Create a wrapper to test the sum function
    const testCode = `
      ${code}

      console.log(sum([1, 2, 3]));
    `;

    // Execute the code with retry logic for rate limiting
    let attempts = 0;
    let result;
    
    while (attempts < 3) {
      try {
        // Add delay to avoid rate limiting
        if (attempts > 0) {
          await delay(300 * attempts); // Increase delay with each retry
        }
        
        result = await pistonClient.execute('typescript', testCode);
        
        // If we get a result with a run property, we're good
        if (result && result.run) {
          break;
        }
      } catch (error) {
        console.log(`Attempt ${attempts + 1} failed:`, error);
      }
      
      attempts++;
    }
    
    // If we still don't have a valid result, return default values
    if (!result || !result.run) {
      return {
        score: 50.0,
        time: 0.3,
        wrongCount: 1,
        output: 'Error executing code due to rate limiting'
      };
    }
    
    // Check if the output is correct (should be 6)
    const output = result.run.stdout.trim();
    const isCorrect = output === '6';
    
    // Score is 88% if correct, 50% otherwise
    const score = isCorrect ? 88.0 : 50.0;
    const wrongCount = isCorrect ? 0 : 1;
    
    return {
      score,
      time: 0.3, // Simplified for demo
      wrongCount,
      output
    };
  } catch (error) {
    console.error('Error executing TypeScript code:', error);
    return {
      score: 50.0,
      time: 0.3,
      wrongCount: 1,
      output: 'Error executing code'
    };
  }
};

/**
 * Get available runtimes from the Piston API
 * 
 * @returns Array of available runtime environments
 */
export const getRuntimes = async (): Promise<any[]> => {
  try {
    return await pistonClient.runtimes();
  } catch (error) {
    console.error('Error getting runtimes:', error);
    return [];
  }
};

// Export all functions as a default object
export default {
  executeRustCode,
  executeTypeScriptCode,
  getRuntimes
};