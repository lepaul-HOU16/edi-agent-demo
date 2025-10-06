# Project Structure

## Root Directory Organization

### Clean Root Structure (Simplicity-First)
```
/ (root)
├── docs/           # All documentation and markdown files
├── tests/          # All test files and test utilities  
├── scripts/        # Build, deployment, and utility scripts
├── src/            # Application source code
├── amplify/        # AWS Amplify backend configuration
├── public/         # Static assets and public files
├── .kiro/          # Kiro configuration
├── package.json    # Dependencies and scripts
├── next.config.js  # Next.js configuration
├── tsconfig.json   # TypeScript configuration
├── tailwind.config.ts # Tailwind CSS configuration
├── README.md       # Primary project documentation
└── .gitignore      # Git configuration
```

### Directory Purposes

#### Documentation (`docs/`)
- **All `.md` files** except root `README.md`
- Implementation summaries and guides
- Architecture documentation
- Deployment guides
- Troubleshooting documentation
- Configuration backups and examples

#### Tests (`tests/`)
- **All test files** (`.test.js`, `.test.ts`, `test-*.js`, etc.)
- Test utilities and helpers
- Test configuration files
- Mock data and fixtures
- Validation scripts

#### Scripts (`scripts/`)
- Build and deployment scripts
- Data processing utilities
- Development helpers
- MCP server implementations
- Python calculation modules

## Source Code Structure (`src/`)

```
src/
├── app/                    # Next.js App Router pages
│   ├── page.tsx           # Landing page
│   ├── auth/              # Authentication pages
│   ├── chat/              # Chat interface
│   ├── catalog/           # Data catalog
│   └── petrophysical-analysis-workflow/  # Professional analysis UI
├── components/            # Reusable React components
│   ├── logVisualization/  # Scientific plotting components
│   └── ui/               # General UI components
├── services/             # Business logic services
│   ├── calculators/      # Petrophysical calculation modules
│   ├── reporting/        # Report generation
│   └── validation/       # Data quality control
├── types/               # TypeScript type definitions
├── utils/               # Utility functions
├── hooks/               # Custom React hooks
└── contexts/            # React context providers
```

## Backend Structure (`amplify/`)

```
amplify/
├── backend.ts           # Main backend configuration
├── auth/               # Cognito authentication setup
├── data/               # GraphQL schema and resolvers
│   └── resource.ts     # Data layer configuration
├── functions/          # Lambda function implementations
│   ├── agents/         # AI agent handlers
│   ├── catalogMapData/ # Data catalog functions
│   └── catalogSearch/  # Search functionality
├── storage/            # S3 bucket configuration
└── custom/             # Custom CDK constructs (MCP server)
```

## Key File Patterns

### Naming Conventions
- **Components**: PascalCase (e.g., `ChatInterface.tsx`)
- **Services**: camelCase (e.g., `petrophysicsEngine.ts`)
- **Types**: PascalCase interfaces (e.g., `WellData`, `CalculationResult`)
- **Test files**: `*.test.ts` or `test-*.js`
- **Configuration**: kebab-case (e.g., `next.config.js`)

### File Organization
- **Feature-based**: Group related functionality together
- **Layer separation**: Clear separation between UI, services, and data
- **Shared utilities**: Common functions in `utils/` and `types/`
- **Test co-location**: Tests near the code they test when possible

## Special Directories

### Documentation (`docs/`)
- Deployment guides
- API references
- Troubleshooting guides
- Architecture documentation

### Scripts (`scripts/`)
- Build optimization scripts
- Data processing utilities
- Deployment helpers
- Performance testing tools

### Labs (`labs/`)
- Tutorial and learning materials
- Example implementations
- Workshop content

## Configuration Files

### Environment
- `.env.local` - Local development environment variables
- `.env.example` - Template for environment setup
- `amplify_outputs.json` - Amplify-generated configuration

### AWS Integration
- `.amplifyrc` - Amplify CLI configuration
- `amplify.yml` - Build and deployment settings
- Backend resources defined in TypeScript (CDK)