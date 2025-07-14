# Development Guidelines

## Core Principles

### 1. Dependency Management When Updating Logic

**CRITICAL**: When updating logic for any field, variable, or screen, always check for dependencies and fix everything it affects.

#### Why This Matters
- Changes to data structures, functions, or components can have cascading effects
- Inconsistent implementations lead to bugs and maintenance issues
- Proper dependency management ensures system reliability

#### What to Check When Making Changes

**Data Transformation Changes:**
- [ ] Update all components that consume the transformed data
- [ ] Check date parsing functions across all screens
- [ ] Verify numeric calculations in dashboard and charts
- [ ] Test data filtering and sorting logic
- [ ] Update any mock data or test fixtures

**Component Logic Changes:**
- [ ] Check all parent components that use the component
- [ ] Verify prop interfaces and default values
- [ ] Update any related utility functions
- [ ] Test component integration points

**API/Service Changes:**
- [ ] Update all consumers of the API
- [ ] Check error handling across the app
- [ ] Verify authentication flows
- [ ] Update any mock implementations

**State Management Changes:**
- [ ] Check all components that use the state
- [ ] Verify action creators and reducers
- [ ] Update any related selectors or computed values
- [ ] Test state persistence and restoration

#### Recent Example: Date Parsing Fix
When we updated the `parseDateString` function to handle Google Sheets date format, we had to:
- ✅ Update `SalesList.jsx` filtering logic
- ✅ Update `Dashboard.jsx` statistics calculations  
- ✅ Update `DashboardChart.jsx` chart data generation
- ✅ Update `formatDate` function to use the new parser
- ✅ Add debugging to `transformSalesData` for troubleshooting

#### Checklist for Every Change
1. **Identify the scope** - What exactly is being changed?
2. **Find all consumers** - Where is this logic/data used?
3. **Update consistently** - Apply the same logic everywhere
4. **Test thoroughly** - Verify all affected areas work correctly
5. **Document changes** - Update comments and documentation

### 2. Cross-Platform Compatibility

All code and components should support Android, iOS, and web platforms.

### 3. Code Quality Standards

- Write concise, well-written code without duplication
- Follow a structured, iterative approach
- Read current code and plan carefully before making changes
- Perform suggested actions rather than asking users to execute them

### 4. Testing Requirements

- Write tests for new functionality
- Update tests when changing existing logic
- Maintain good test coverage
- Test across all platforms when applicable

### 5. Error Handling

- Implement proper error boundaries
- Add validation for user inputs
- Handle edge cases gracefully
- Provide meaningful error messages

## File Organization

### Utils and Helpers
- Keep utility functions in dedicated files
- Use consistent naming conventions
- Export functions that might be reused
- Add proper JSDoc comments

### Components
- Follow single responsibility principle
- Use proper prop validation
- Implement error boundaries where needed
- Keep components focused and testable

### State Management
- Use context for global state
- Keep local state minimal
- Implement proper loading states
- Handle async operations gracefully

## Common Patterns

### Date Handling
```javascript
// Always use the parseDateString utility
import { parseDateString } from '../utils/dateUtils'

const saleDate = parseDateString(sale.date)
if (!saleDate) {
  console.warn('Invalid date:', sale.date)
  return false
}
```

### Data Transformation
```javascript
// Always handle null/undefined values
const total = items.reduce((sum, item) => sum + (item.value || 0), 0)
```

### Error Handling
```javascript
// Always provide fallbacks
const displayValue = data?.field || 'N/A'
```

## Review Process

Before committing any changes:
1. [ ] All dependencies updated consistently
2. [ ] Tests pass across all platforms
3. [ ] No console errors or warnings
4. [ ] Code follows established patterns
5. [ ] Documentation updated if needed

## Remember

**The most important rule**: When you change something, find everything that depends on it and update it too. This prevents the cascade of bugs we've seen with date parsing, data transformation, and component integration. 