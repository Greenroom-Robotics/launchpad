# Modular Refactoring Plan - Launchpad

## Executive Summary

This plan outlines a refactoring of the main package into a domain-driven modular architecture inspired by NestJS. The goal is to improve code organization, maintainability, and scalability by grouping related functionality into cohesive modules.

## Current Architecture Analysis

### Current Structure
```
packages/main/src/
├── index.ts (initialization orchestration)
├── di.ts (dependency injection setup)
├── types.ts (DI tokens)
├── interfaces.ts (IInitializable)
├── AppInitConfig.ts
├── modules/
│   ├── AutoStartManager.ts
│   ├── AutoUpdater.ts
│   ├── BackgroundOperationManager.ts
│   ├── BlockNotAllowdOrigins.ts
│   ├── ConfigurationManager.ts
│   ├── ExternalUrls.ts
│   ├── HardwareAccelerationModule.ts
│   ├── MenuManager.ts
│   ├── SingleInstanceApp.ts
│   ├── TrayManager.ts
│   └── WindowManager.ts
└── trpc/
    ├── procedures.ts
    ├── router.ts
    └── routers/
        ├── app.ts
        └── config.ts
```

### Issues with Current Architecture
1. **Flat module structure** - All managers in one directory without domain grouping
2. **Scattered concerns** - Related functionality spread across multiple files
3. **Unclear dependencies** - Hard to see which modules depend on each other
4. **Mixed responsibilities** - Some managers handle multiple concerns
5. **No clear module boundaries** - Everything can access everything

## Proposed Architecture

### Domain-Driven Module Structure

```
packages/main/src/
├── index.ts (app bootstrapping)
├── core/
│   ├── di/ (dependency injection utilities)
│   │   ├── container.ts
│   │   ├── tokens.ts
│   │   └── types.ts
│   ├── interfaces/
│   │   ├── IInitializable.ts
│   │   ├── IModule.ts
│   │   └── IService.ts
│   └── trpc/
│       ├── procedures.ts
│       ├── createRouter.ts
│       └── types.ts
├── config/
│   └── AppInitConfig.ts
└── modules/
    ├── applications/
    │   ├── applications.module.ts
    │   ├── services/
    │   │   ├── application-launcher.service.ts
    │   │   └── connectivity-checker.service.ts
    │   ├── routers/
    │   │   └── applications.router.ts
    │   └── types.ts
    ├── configuration/
    │   ├── configuration.module.ts
    │   ├── services/
    │   │   └── configuration.service.ts
    │   ├── stores/
    │   │   └── config.store.ts
    │   ├── routers/
    │   │   └── configuration.router.ts
    │   └── types.ts
    ├── windows/
    │   ├── windows.module.ts
    │   ├── services/
    │   │   ├── window-manager.service.ts
    │   │   └── window-factory.service.ts
    │   ├── types.ts
    │   └── constants.ts
    ├── system/
    │   ├── system.module.ts
    │   ├── services/
    │   │   ├── tray.service.ts
    │   │   ├── menu.service.ts
    │   │   ├── auto-start.service.ts
    │   │   └── single-instance.service.ts
    │   └── types.ts
    ├── updates/
    │   ├── updates.module.ts
    │   ├── services/
    │   │   └── auto-updater.service.ts
    │   └── types.ts
    ├── security/
    │   ├── security.module.ts
    │   ├── services/
    │   │   ├── origin-blocker.service.ts
    │   │   └── external-urls.service.ts
    │   └── types.ts
    └── platform/
        ├── platform.module.ts
        └── services/
            ├── hardware-acceleration.service.ts
            └── background-operations.service.ts
```

## Module Definitions

### 1. Core Module
**Purpose**: Shared infrastructure and utilities

**Components**:
- DI container utilities
- Common interfaces (IInitializable, IModule, IService)
- tRPC setup utilities
- Base types

**Exports**:
- Container utilities
- Base interfaces
- tRPC helpers

### 2. Applications Module
**Purpose**: Manage application instances and their lifecycle

**Services**:
- `ApplicationLauncherService`: Launch and track application windows
- `ConnectivityCheckerService`: Check application connectivity

**Routers**:
- `applications.router.ts`:
  - `openApplication(url, name)`
  - `checkConnectivity(url)`

**Dependencies**:
- Windows Module (to create windows)
- Configuration Module (to get app list)

### 3. Configuration Module
**Purpose**: Persist and retrieve application configuration

**Services**:
- `ConfigurationService`: CRUD operations on config

**Stores**:
- `ConfigStore`: electron-store wrapper for persistence

**Routers**:
- `configuration.router.ts`:
  - `getApplications()`
  - `setApplications(apps)`
  - `getConfig()`
  - `setConfig(config)`
  - `resetToDefault()`

**Dependencies**: None (leaf module)

### 4. Windows Module
**Purpose**: Create and manage Electron browser windows

**Services**:
- `WindowManagerService`: High-level window management
- `WindowFactoryService`: Create configured windows

**Dependencies**:
- Core Module

### 5. System Module
**Purpose**: OS-level integrations (tray, menu, auto-start)

**Services**:
- `TrayService`: System tray icon and menu
- `MenuService`: Application menu
- `AutoStartService`: Launch on system startup
- `SingleInstanceService`: Ensure single app instance

**Dependencies**:
- Windows Module (to show/create windows)

### 6. Updates Module
**Purpose**: Handle automatic updates

**Services**:
- `AutoUpdaterService`: Check and install updates

**Dependencies**: None (leaf module)

### 7. Security Module
**Purpose**: Security policies and restrictions

**Services**:
- `OriginBlockerService`: Block non-allowed origins
- `ExternalUrlsService`: Handle external URL navigation

**Dependencies**:
- Core Module

### 8. Platform Module
**Purpose**: Platform-specific features and optimizations

**Services**:
- `HardwareAccelerationService`: Enable/disable GPU
- `BackgroundOperationsService`: Handle background tasks

**Dependencies**: None (leaf module)

## Module Pattern

Each module follows this structure:

### Module Definition (`*.module.ts`)
```typescript
import { Module } from '../core/interfaces/IModule';

export class ApplicationsModule implements Module {
  readonly name = 'applications';

  // Services to register in DI container
  readonly services = [
    ApplicationLauncherService,
    ConnectivityCheckerService,
  ];

  // tRPC routers to register
  readonly routers = {
    app: applicationsRouter,
  };

  // Dependencies on other modules
  readonly imports = ['windows', 'configuration'];

  async initialize(): Promise<void> {
    // Module-level initialization
  }
}
```

### Service Pattern
```typescript
@singleton()
export class ApplicationLauncherService implements IService {
  constructor(
    @inject(WindowManagerService) private windowManager: WindowManagerService,
    @inject(ConfigurationService) private configService: ConfigurationService,
  ) {}

  async initialize(): Promise<void> {
    // Service initialization
  }

  // Business logic methods
  async launchApplication(url: string, name: string): Promise<void> {
    // ...
  }
}
```

### Router Pattern
```typescript
import { router, publicProcedure, injectService } from '../../core/trpc/procedures';

export const applicationsRouter = router({
  openApplication: publicProcedure
    .input(z.object({ url: z.string(), name: z.string() }))
    .use(injectService(ApplicationLauncherService))
    .mutation(async ({ ctx, input }) => {
      await ctx.service.launchApplication(input.url, input.name);
      return { success: true };
    }),
});
```

## Migration Strategy

### Phase 1: Core Infrastructure (Low Risk)
1. Create `core/` directory structure
2. Move and refactor DI utilities
3. Define module interfaces (IModule, IService)
4. Create module registry system

### Phase 2: Leaf Modules (Low Risk)
Refactor modules with no dependencies first:
1. Configuration Module
2. Updates Module
3. Platform Module
4. Security Module (partial)

### Phase 3: Foundation Modules (Medium Risk)
5. Windows Module (used by many others)

### Phase 4: Dependent Modules (Medium Risk)
6. Applications Module (depends on Windows + Configuration)
7. System Module (depends on Windows)

### Phase 5: Integration (Higher Risk)
8. Update `index.ts` to use module system
9. Test all integrations
10. Remove old code

### Phase 6: Cleanup
11. Remove old files
12. Update imports across codebase
13. Update documentation

## Benefits

### Immediate Benefits
- **Clear boundaries**: Each domain has its own namespace
- **Better discoverability**: Easy to find where functionality lives
- **Reduced cognitive load**: Smaller, focused files

### Long-term Benefits
- **Easier testing**: Mock dependencies at module boundaries
- **Better scalability**: Add new modules without affecting existing ones
- **Clearer dependencies**: Module imports make relationships explicit
- **Team collaboration**: Different developers can own different modules

## Example: Before & After

### Before
```typescript
// index.ts - Everything initialized in sequence
const configurationManager = container.resolve(ConfigurationManager);
await configurationManager.initialize();

const windowManager = container.resolve(WindowManager);
await windowManager.initialize();

const trayManager = container.resolve(TrayManager);
await trayManager.initialize();
// ... 10 more managers
```

### After
```typescript
// index.ts - Module-based initialization
const moduleRegistry = new ModuleRegistry();

// Register modules in dependency order
moduleRegistry.register(new CoreModule());
moduleRegistry.register(new ConfigurationModule());
moduleRegistry.register(new WindowsModule());
moduleRegistry.register(new ApplicationsModule());
moduleRegistry.register(new SystemModule());
moduleRegistry.register(new SecurityModule());
moduleRegistry.register(new UpdatesModule());
moduleRegistry.register(new PlatformModule());

// Initialize all modules (handles dependencies automatically)
await moduleRegistry.initializeAll();

// Build tRPC router from all module routers
const appRouter = moduleRegistry.buildRouter();
```

## Naming Conventions

- **Modules**: `{domain}.module.ts`
- **Services**: `{name}.service.ts`
- **Routers**: `{domain}.router.ts`
- **Stores**: `{name}.store.ts`
- **Types**: `types.ts` or `{domain}.types.ts`
- **Constants**: `constants.ts`

## Testing Strategy

### Unit Tests
Each service can be tested in isolation with mocked dependencies:
```typescript
describe('ApplicationLauncherService', () => {
  let service: ApplicationLauncherService;
  let mockWindowManager: jest.Mocked<WindowManagerService>;

  beforeEach(() => {
    mockWindowManager = createMockWindowManager();
    service = new ApplicationLauncherService(mockWindowManager, ...);
  });

  it('should launch application window', async () => {
    await service.launchApplication('http://localhost:3000', 'Test App');
    expect(mockWindowManager.createApplicationWindow).toHaveBeenCalled();
  });
});
```

### Integration Tests
Test module interactions:
```typescript
describe('Applications + Windows Integration', () => {
  let registry: ModuleRegistry;

  beforeEach(async () => {
    registry = new ModuleRegistry();
    registry.register(new WindowsModule());
    registry.register(new ApplicationsModule());
    await registry.initializeAll();
  });

  it('should create window when launching app', async () => {
    // Test cross-module interaction
  });
});
```

## Risk Assessment

### Low Risk
- Creating new directory structure
- Moving interfaces
- Refactoring DI utilities

### Medium Risk
- Changing initialization order
- Updating import paths
- Refactoring individual modules

### High Risk
- Changing tRPC router structure (affects frontend)
- Modifying service interfaces (breaks contracts)

## Rollback Plan

1. Keep old code in place during migration
2. Use feature flags to switch between old/new implementations
3. Migrate one module at a time
4. Run both systems in parallel temporarily
5. Comprehensive testing before removing old code

## Success Metrics

- **Code organization**: Clear module boundaries with < 5 files per module
- **Dependency clarity**: Explicit module imports, no circular dependencies
- **Maintainability**: New features can be added within a single module
- **Test coverage**: Each service has unit tests with >80% coverage
- **Build time**: No regression in build performance
- **Bundle size**: No significant increase in bundle size

## Next Steps

1. **Review & Approve**: Get team feedback on this plan
2. **Prototype**: Create a proof-of-concept with one module (e.g., Configuration)
3. **Iterate**: Refine based on prototype learnings
4. **Execute**: Follow migration strategy phase by phase
5. **Document**: Update developer documentation with new patterns
