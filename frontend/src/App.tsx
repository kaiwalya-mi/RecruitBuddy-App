import React from 'react';
import { Routes, Route } from 'react-router-dom';
import styled, { createGlobalStyle } from 'styled-components';
import CandidatePortal from './components/CandidatePortal';
import RecruiterDashboard from './components/RecruiterDashboard';

/**
 * Global styles for the application
 * 
 * Sets up a dark theme with Apple-inspired styling
 */
const GlobalStyle = createGlobalStyle`
  body {
    background-color: #000;
    color: #f5f5f7;
    margin: 0;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, 
      Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }
  
  * {
    box-sizing: border-box;
  }
`;

// Simple styled components with clear names
const AppContainer = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
`;

const Header = styled.header`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
  padding: 15px 0;
`;

const Logo = styled.div`
  display: flex;
  align-items: center;
`;

const LogoText = styled.h1`
  font-size: 24px;
  font-weight: 600;
  margin: 0;
  background: linear-gradient(90deg, #007aff, #5ac8fa);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
`;

const Nav = styled.nav`
  display: flex;
  gap: 20px;
`;

const NavLink = styled.a`
  text-decoration: none;
  color: #f5f5f7;
  font-weight: 500;
  font-size: 16px;
  padding: 8px 16px;
  border-radius: 8px;
  
  &:hover {
    background-color: rgba(255, 255, 255, 0.1);
  }
  
  &.active {
    background-color: rgba(255, 255, 255, 0.05);
    color: #0071e3;
  }
`;

/**
 * Main App Component
 * 
 * Provides the application layout and routing between:
 * - Candidate Portal: Where candidates submit code and answer questions
 * - Recruiter Dashboard: Where recruiters view results and add custom questions
 */
const App: React.FC = () => {
  // Determine active route for navigation highlighting
  const path = window.location.pathname;
  
  return (
    <>
      <GlobalStyle />
      <AppContainer>
        {/* Navigation Header */}
        <Header>
          <Logo>
            <LogoText>Recruit Buddy</LogoText>
          </Logo>
          <Nav>
            <NavLink href="/" className={path === '/' ? 'active' : ''}>
              Candidate Portal
            </NavLink>
            <NavLink href="/recruiter" className={path === '/recruiter' ? 'active' : ''}>
              Recruiter Dashboard
            </NavLink>
          </Nav>
        </Header>
        
        {/* Main Content Routes */}
        <Routes>
          <Route path="/" element={<CandidatePortal />} />
          <Route path="/recruiter" element={<RecruiterDashboard />} />
        </Routes>
      </AppContainer>
    </>
  );
};

export default App;