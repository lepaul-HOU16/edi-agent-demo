# Simplicity-First Development Guidelines

## Core Philosophy: Start Simple, Evolve Incrementally

Always choose the **simplest solution that works** for the immediate requirement. Add complexity only when simpler approaches prove insufficient through actual usage, not theoretical concerns.

## Decision Framework

### 1. Solution Hierarchy (Apply in Order)
1. **Direct/Inline Solution**: Solve directly in existing code if < 10 lines
2. **Single Function**: Extract to utility function if reusable
3. **Simple Module**: Create focused module for related functionality
4. **Service Layer**: Add service abstraction only when multiple modules need coordination
5. **Complex Architecture**: Implement patterns/frameworks only when simpler approaches fail

### 2. Implementation Principles

#### Start Minimal
- Write the least code possible to satisfy the requirement
- Use existing libraries and patterns before creating new ones
- Prefer configuration over code when possible
- Choose boring, proven solutions over novel approaches

#### Incremental Enhancement
- Add features only when users request them
- Optimize only when performance problems are measured
- Abstract only when duplication becomes painful (3+ instances)
- Refactor only when maintenance becomes difficult

#### Evidence-Based Complexity
- **Don't**: Add complexity for theoretical future needs
- **Do**: Add complexity when current approach demonstrably fails
- **Don't**: Over-engineer for scale you don't have
- **Do**: Monitor and measure before optimizing

## Root Directory Organization

### Clean Root Policy
Keep the root directory **minimal and focused**. Move all supporting files to dedicated directories:

```
/ (root)
├── docs/           # All documentation and markdown files
├── tests/          # All test files and test utilities
├── scripts/        # Build, deployment, and utility scripts
├── src/            # Application source code
├── amplify/        # AWS Amplify configuration
├── public/         # Static assets
├── .kiro/          # Kiro configuration
├── package.json    # Dependencies
├── next.config.js  # Next.js config
├── tsconfig.json   # TypeScript config
├── tailwind.config.ts # Tailwind config
├── README.md       # Primary project documentation
└── .gitignore      # Git configuration
```

### File Organization Rules

#### Documentation (`docs/`)
- **All `.md` files** except root `README.md`
- Implementation summaries and guides
- Architecture documentation
- Deployment guides
- Troubleshooting documentation

#### Tests (`tests/`)
- **All test files** (`.test.js`, `.test.ts`, `test-*.js`, etc.)
- Test utilities and helpers
- Test configuration files
- Mock data and fixtures

#### Scripts (`scripts/`)
- Build and deployment scripts
- Data processing utilities
- Development helpers
- Validation and debugging scripts

## Implementation Guidelines

### 1. Feature Development
```typescript
// ❌ Over-engineered from start
class FeatureManager {
  private strategy: FeatureStrategy;
  private validator: FeatureValidator;
  private cache: FeatureCache;
  // ... complex architecture
}

// ✅ Start simple
function processFeature(data: FeatureData) {
  // Direct implementation
  return transformData(data);
}
```

### 2. Error Handling
```typescript
// ❌ Complex error system upfront
class ErrorManager {
  handleError(error: CustomError) {
    // Complex error categorization, logging, recovery
  }
}

// ✅ Start simple
function handleError(error: Error) {
  console.error('Feature failed:', error.message);
  throw error; // Let caller decide recovery
}
```

### 3. Configuration
```typescript
// ❌ Complex config system
interface ConfigSchema {
  features: FeatureConfig[];
  environments: EnvironmentConfig;
  // ... many options
}

// ✅ Start simple
const config = {
  apiUrl: process.env.API_URL || 'http://localhost:3000',
  enableFeature: process.env.ENABLE_FEATURE === 'true'
};
```

## Complexity Triggers

Add complexity **only** when you encounter these specific problems:

### Performance Issues
- **Trigger**: Measured performance problems (> 2s load time, > 100ms response)
- **Solution**: Add caching, optimization, or async processing

### Code Duplication
- **Trigger**: Same logic repeated 3+ times
- **Solution**: Extract to shared function or utility

### Maintenance Pain
- **Trigger**: Changes require modifying 5+ files
- **Solution**: Add abstraction layer or service

### Integration Complexity
- **Trigger**: Multiple systems need coordination
- **Solution**: Add service layer or event system

## Anti-Patterns to Avoid

### ❌ Premature Optimization
- Don't add caching until you measure slow performance
- Don't optimize database queries until you have performance issues
- Don't add complex state management until simple state becomes unwieldy

### ❌ Speculative Features
- Don't build features "users might want"
- Don't add configuration options "for flexibility"
- Don't create abstractions "for future extensibility"

### ❌ Framework Overuse
- Don't use complex frameworks for simple tasks
- Don't add dependencies for single-use functionality
- Don't implement patterns without clear benefit

## Success Metrics

### Code Quality
- **Lines of Code**: Prefer fewer lines for same functionality
- **Dependencies**: Minimize external dependencies
- **Complexity**: Prefer linear code flow over nested abstractions

### Development Speed
- **Time to Feature**: Measure implementation time
- **Time to Change**: Measure modification time
- **Time to Debug**: Measure problem resolution time

### Maintainability
- **Onboarding Time**: New developers understand code quickly
- **Change Impact**: Small changes require small code modifications
- **Bug Frequency**: Simple code has fewer bugs

## Migration Strategy for Current Codebase

### Phase 1: Organize Root Directory
1. Create `docs/`, `tests/`, `scripts/` directories
2. Move all `.md` files to `docs/` (except `README.md`)
3. Move all test files to `tests/`
4. Move all script files to `scripts/`
5. Update import paths and references

### Phase 2: Simplify Existing Code
1. Identify over-engineered components
2. Replace complex patterns with simple implementations
3. Remove unused abstractions and utilities
4. Consolidate duplicate functionality

### Phase 3: Establish Simple Patterns
1. Create simple templates for common tasks
2. Document simple approaches for team
3. Establish code review criteria favoring simplicity
4. Monitor and measure complexity metrics

## Decision Questions

Before adding complexity, ask:

1. **Is this solving a real problem we have today?**
2. **What's the simplest solution that could work?**
3. **Can we solve this with existing code/libraries?**
4. **Will this make the code easier or harder to understand?**
5. **Can we measure if this improvement actually helps?**

If you can't answer these clearly, choose the simpler approach.