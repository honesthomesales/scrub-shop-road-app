# Testing Setup for Scrub Shop Road App

This document describes the testing infrastructure set up for the React application.

## Overview

The app uses Jest as the test runner with React Testing Library for component testing. The setup includes:

- **Jest**: Test runner and assertion library
- **React Testing Library**: Component testing utilities
- **@testing-library/jest-dom**: Custom Jest matchers for DOM testing
- **@testing-library/user-event**: User interaction simulation
- **jest-environment-jsdom**: Browser-like environment for testing

## Test Structure

```
web/
├── src/
│   ├── __mocks__/           # Mock files for external dependencies
│   │   ├── envMock.js       # Mock for Vite environment variables
│   │   └── googleSheetsAPI.js # Mock for Google Sheets API
│   ├── components/
│   │   └── Header.test.jsx  # Component tests
│   ├── utils/
│   │   ├── dateUtils.test.js    # Utility function tests
│   │   └── sheetMappings.test.js # Data transformation tests
│   └── setupTests.js        # Jest setup file
├── jest.config.cjs          # Jest configuration
└── babel.config.cjs         # Babel configuration for Jest
```

## Running Tests

### All Tests
```bash
npm test
# or
npx jest
```

### Watch Mode (for development)
```bash
npm run test:watch
# or
npx jest --watch
```

### Coverage Report
```bash
npm run test:coverage
# or
npx jest --coverage
```

### Specific Test File
```bash
npx jest src/utils/dateUtils.test.js
```

## Test Categories

### 1. Utility Function Tests (`src/utils/`)
- **dateUtils.test.js**: Tests date parsing and formatting functions
- **sheetMappings.test.js**: Tests data transformation functions for Google Sheets

### 2. Component Tests (`src/components/`)
- **Header.test.jsx**: Tests the Header component rendering and navigation

### 3. Mock Files (`src/__mocks__/`)
- **envMock.js**: Mocks Vite environment variables for testing
- **googleSheetsAPI.js**: Mocks the Google Sheets API to avoid external dependencies

## Writing Tests

### Component Test Example
```javascript
import React from 'react';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import MyComponent from './MyComponent';

const renderWithProviders = (component) => {
  return render(
    <BrowserRouter>
      {component}
    </BrowserRouter>
  );
};

describe('MyComponent', () => {
  it('renders correctly', () => {
    renderWithProviders(<MyComponent />);
    expect(screen.getByText('Expected Text')).toBeInTheDocument();
  });
});
```

### Utility Function Test Example
```javascript
import { myFunction } from './myUtils';

describe('myUtils', () => {
  it('handles valid input', () => {
    const result = myFunction('valid input');
    expect(result).toBe('expected output');
  });

  it('handles invalid input', () => {
    const result = myFunction(null);
    expect(result).toBeNull();
  });
});
```

## Configuration Details

### Jest Configuration (`jest.config.cjs`)
- Uses `jsdom` environment for browser-like testing
- Transforms JS/JSX files with Babel
- Sets up `@testing-library/jest-dom` matchers
- Mocks Vite environment variables

### Babel Configuration (`babel.config.cjs`)
- Supports modern JavaScript features
- Handles JSX transformation
- Uses automatic runtime for React

## Best Practices

1. **Test Structure**: Use `describe` blocks to group related tests
2. **Test Names**: Use descriptive test names that explain the expected behavior
3. **Mocking**: Mock external dependencies to isolate the code under test
4. **User Behavior**: Test components as users would interact with them
5. **Edge Cases**: Include tests for error conditions and edge cases

## Troubleshooting

### Common Issues

1. **Import.meta.env errors**: Ensure the `envMock.js` file is properly configured
2. **React Router warnings**: These are expected in tests and can be ignored
3. **Act warnings**: Wrap state updates in `act()` when testing async behavior

### Adding New Tests

1. Create a test file with `.test.js` or `.test.jsx` extension
2. Import the module/component to test
3. Write test cases using Jest and React Testing Library
4. Run tests to ensure they pass

## Coverage Goals

The testing setup aims for:
- **Unit Tests**: 80%+ coverage for utility functions
- **Component Tests**: Key user interactions and rendering
- **Integration Tests**: Critical user workflows

## Continuous Integration

Tests should be run:
- Before committing code
- In CI/CD pipelines
- Before deploying to production

This ensures code quality and prevents regressions. 