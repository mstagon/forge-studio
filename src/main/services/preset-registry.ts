import type { TechStackPreset } from '../../shared/types/preset.types'

// ── Base agents (shared across all stacks) ──

const BASE_AGENTS = {
  productPlanner: (stack: string) => `# product-planner

You are a senior product manager.

## Role
Write PRDs (Product Requirements Documents) for new features.

## Rules
- Use concrete specifications (not "fast" but "under 3 seconds")
- Follow docs/templates/prd-template.md format
- Include: background, target users, user stories, requirements, edge cases, success metrics
- Write in the project's primary language
- Save output to docs/prd/{feature-name}.md

## Tech Context
${stack}

## Output Format
Structured PRD in Markdown with numbered sections.`,

  techArchitect: (stack: string, arch: string) => `# tech-architect

You are a senior software architect.

## Role
Create technical specifications from approved PRDs.

## Rules
- Read the PRD from docs/prd/ first
- Use context7 MCP to verify package APIs (no hallucination)
- Reference existing codebase patterns for consistency
- Follow docs/templates/spec-template.md format
- Include: architecture, data models, API contracts, state management, error handling, test strategy
- Save output to docs/specs/{feature-name}-spec.md

## Tech Context
${stack}

## Architecture
${arch}

## Output Format
Structured technical spec in Markdown.`,

  taskDecomposer: () => `# task-decomposer

You are a task decomposition specialist.

## Role
Break technical specs into executable, ordered tasks.

## Rules
- Read the spec from docs/specs/ first
- Size each task for ~30 min completion
- Identify dependencies and parallel groups
- Assign appropriate agent to each task
- Define clear completion criteria per task
- Register tasks via TodoWrite

## Output Format
Ordered task list with: ID, description, dependencies, assigned agent, completion criteria.`,

  codeReviewer: (rules: string) => `# code-reviewer

You are a senior code reviewer focused on production quality.

## Role
Review code changes before commit.

## Rules
- Check docs/lessons-learned.md first (prevent past mistakes)
- Severity levels: 🔴 Critical (blocks commit), 🟡 Warning (should fix), 🔵 Suggestion
- Run static analysis and tests
- Verify spec compliance

## Critical Issues (🔴)
- Memory leaks, resource disposal
- Security vulnerabilities
- Error swallowing
- Hardcoded secrets

## Coding Standards
${rules}

## Output Format
Categorized findings with severity, file:line, description, fix suggestion.`,

  securityAuditor: () => `# security-auditor

You are a security specialist.

## Role
Audit code for security vulnerabilities.

## Areas
1. Authentication & Authorization
2. Input validation
3. Data protection
4. Network security (HTTPS)
5. Secret management
6. Dependency vulnerabilities

## Output Format
Severity-classified findings with fix guidance.`,

  docWriter: () => `# doc-writer

You are a documentation specialist and organizational learning manager.

## Role
Maintain all project documentation and track lessons learned.

## Responsibilities
1. API docs update (docs/api/)
2. Code documentation validation
3. CHANGELOG maintenance (conventional commits)
4. Architecture Decision Records (docs/architecture/)
5. Lessons Learned tracking (docs/lessons-learned.md)

## Self-Improvement Protocol
- Record: date, mistake, root cause, prevention, related files
- Track repeat count
- If pattern repeats 3x → propose CLAUDE.md rule addition

## Output Format
Updated documentation files with change summary.`
}

// ── Presets ──

export const PRESETS: TechStackPreset[] = [
  {
    id: 'flutter-supabase',
    name: 'Flutter + Supabase',
    description: 'Flutter mobile app with Supabase BaaS backend',
    icon: '📱',
    category: 'mobile',
    stack: {
      language: 'Dart 3.10+',
      framework: 'Flutter 3.38+',
      stateManagement: 'Riverpod 2.x (codegen, @riverpod)',
      backend: 'Supabase (Auth, Storage, Edge Functions, Realtime)',
      router: 'go_router (ShellRoute)',
      database: 'drift (local)',
      packages: ['freezed + json_serializable', 'dio + retrofit']
    },
    architecture: {
      pattern: 'feature-first + layered',
      structure: 'lib/features/{name}/{data,domain,presentation}/',
      reference: 'lib/features/auth/'
    },
    build: {
      setup: 'flutter pub get',
      codegen: 'dart run build_runner build --delete-conflicting-outputs',
      analyze: 'flutter analyze',
      test: 'flutter test',
      format: 'dart format .'
    },
    codingRules: [
      'const constructors wherever possible',
      'Never pass BuildContext across async gaps',
      'No setState (use Riverpod)',
      'No Navigator.push (use go_router)',
      'All public APIs must have /// dartdoc',
      'Error handling: Result pattern (core/utils/result.dart)',
      'Run pod install after adding packages: cd ios && pod install',
      'Run build_runner after freezed changes'
    ],
    forbiddenPatterns: [
      'any, dynamic types',
      'print() (use logger)',
      'Force unwrap ! (null assertion)',
      'Hardcoded .env values',
      'Secrets/API keys in git'
    ],
    agents: [
      { fileName: 'product-planner', content: '' },
      { fileName: 'tech-architect', content: '' },
      { fileName: 'task-decomposer', content: '' },
      { fileName: 'flutter-ui', content: `# flutter-ui

You are a Flutter UI specialist.

## Role
Implement Flutter UI widgets and screens based on technical specs.

## Rules
- Read the spec from docs/specs/ before implementing
- Use context7 MCP to verify package APIs
- const constructors, RepaintBoundary for performance
- ListView.builder for lists (never ListView with children)
- Theme system for all colors/typography (no hardcoded values)
- Semantics for accessibility
- Max 80 lines per build method (decompose into smaller widgets)
- All public widgets must have /// dartdoc

## Patterns
- ConsumerWidget for Riverpod integration
- ref.watch() in build(), ref.read() in callbacks only
- GoRouter for navigation

## Output
lib/features/{name}/presentation/ directory` },
      { fileName: 'riverpod-logic', content: `# riverpod-logic

You are a Riverpod state management specialist.

## Role
Implement Riverpod providers and controllers.

## Rules
- Use code generation (@riverpod annotation)
- AsyncNotifier for async operations, Notifier for sync
- Always handle 3 states: loading, error, data
- ref.watch() only in build(), ref.read() only in callbacks
- autoDispose by default
- Run build_runner after changes
- Use select() to prevent unnecessary rebuilds

## Patterns
\`\`\`dart
@riverpod
class FeatureController extends _$FeatureController {
  @override
  FutureOr<FeatureState> build() => _fetch();
  Future<FeatureState> _fetch() async { ... }
  Future<void> refresh() async { state = await AsyncValue.guard(_fetch); }
}
\`\`\`

## Output
lib/features/{name}/domain/ directory` },
      { fileName: 'supabase-backend', content: `# supabase-backend

You are a Supabase backend specialist.

## Role
Implement Supabase Auth, DB, Storage, and Edge Functions.

## Rules
- Read API spec and data models from docs/specs/ first
- RLS policies are mandatory and must be explicit
- Edge Functions in TypeScript with proper error handling
- Environment variables via dotenv (never hardcode)
- Create migration files for all DB changes
- Update docs/api/ after implementation

## Output
lib/features/{name}/data/ directory + supabase/migrations/` },
      { fileName: 'test-writer', content: `# test-writer

You are a Flutter test specialist.

## Role
Write unit, widget, and integration tests.

## Rules
- Use mocktail (not mockito)
- given/when/then structure
- Cover: normal flow, edge cases, error cases
- Test file location: test/features/{name}/
- Naming: {original}_test.dart

## Output
Test files + coverage summary` },
      { fileName: 'code-reviewer', content: '' },
      { fileName: 'security-auditor', content: '' },
      { fileName: 'spec-verifier', content: `# spec-verifier

You are a specification compliance verifier.

## Role
Validate that implementation matches the technical spec.

## Verification Areas
1. Data models match spec definitions
2. API contracts match spec endpoints
3. State management matches spec providers
4. Error handling matches spec patterns
5. Routing matches spec paths
6. UI requirements met

## Output
Alignment report: ✅ Match / ❌ Mismatch / ⚠️ Missing, with details.` },
      { fileName: 'doc-writer', content: '' }
    ],
    commands: [
      { fileName: 'plan-feature', content: `Plan a new feature from scratch.

## Arguments
- $ARGUMENTS — feature name

## Steps
1. Check docs/planningdocs/ for existing planning documents
2. Run product-planner agent → create PRD in docs/prd/$ARGUMENTS.md
3. Wait for user approval
4. Run tech-architect agent → create spec in docs/specs/$ARGUMENTS-spec.md
5. Wait for user approval
6. Run task-decomposer agent → create tasks via TodoWrite
7. Report summary` },
      { fileName: 'implement', content: `Implement a feature based on its technical spec.

## Arguments
- $ARGUMENTS — feature name

## Steps
1. Read docs/specs/$ARGUMENTS-spec.md
2. Load tasks from TodoRead (or decompose if missing)
3. Execute tasks in dependency order using appropriate agents
4. Run flutter analyze + flutter test after each task
5. Report progress and results` },
      { fileName: 'review', content: `Review current branch changes.

## Steps
1. Run code-reviewer, security-auditor, and spec-verifier in parallel
2. Consolidate results with severity counts
3. If any 🔴 Critical → FAIL (block commit)
4. If all clear → PASS
5. Offer to fix issues if found` },
      { fileName: 'full-cycle', content: `Run the complete development cycle for a feature.

## Arguments
- $ARGUMENTS — feature name

## Steps
1. /project:plan-feature $ARGUMENTS (with approval gates)
2. /project:implement $ARGUMENTS
3. /project:review
4. Update documentation
5. Pre-commit validation
6. Suggest commit message` },
      { fileName: 'retrospective', content: `Run a session retrospective.

## Steps
1. Analyze git diff for this session
2. Identify error patterns and fixes
3. Record new lessons in docs/lessons-learned.md
4. Check for 3x repeat patterns
5. Propose CLAUDE.md updates if needed` }
    ],
    skills: [
      { dirName: 'freezed-models', content: `# Freezed Model Patterns

## Entity (pure domain)
\`\`\`dart
@freezed
class Product with _$Product {
  const factory Product({
    required String id,
    required String name,
    required int price,
  }) = _Product;
}
\`\`\`

## DTO (API/DB mapping)
\`\`\`dart
@freezed
class ProductDto with _$ProductDto {
  const factory ProductDto({
    @JsonKey(name: 'product_id') required String id,
    required String name,
    @JsonKey(name: 'price_cents') required int price,
  }) = _ProductDto;

  factory ProductDto.fromJson(Map<String, dynamic> json) => _$ProductDtoFromJson(json);
}

extension ProductDtoX on ProductDto {
  Product toEntity() => Product(id: id, name: name, price: price);
}
\`\`\`

## Rules
- Entity = pure domain, no fromJson
- DTO = API/DB mapping with fromJson + toEntity()
- Always run: dart run build_runner build --delete-conflicting-outputs` },
      { dirName: 'riverpod-patterns', content: `# Riverpod Patterns

## AsyncNotifier
\`\`\`dart
@riverpod
class ProductController extends _$ProductController {
  @override
  FutureOr<List<Product>> build() => _fetch();

  Future<List<Product>> _fetch() async {
    final repo = ref.watch(productRepositoryProvider);
    return repo.getAll();
  }

  Future<void> refresh() async {
    state = const AsyncLoading();
    state = await AsyncValue.guard(_fetch);
  }
}
\`\`\`

## Rules
- ref.watch → build() only
- ref.read → callbacks only
- autoDispose by default
- Always handle 3 states (loading/error/data)
- Use select() to prevent unnecessary rebuilds` }
    ],
    hooks: {
      PostToolUse: [
        { matcher: 'Edit|Write', command: 'dart format "$FILE" && flutter analyze "$FILE" 2>&1 | tail -5' },
        { matcher: 'Write(pubspec.yaml)', command: 'flutter pub get && cd ios && pod install 2>&1 | tail -3' }
      ],
      PreToolUse: [
        { matcher: 'Bash', command: 'echo "$COMMAND" | grep -qE "rm -rf|sudo|flutter build release" && echo "BLOCKED" && exit 1 || true' }
      ]
    },
    recommendedMcp: [
      { name: 'context7', command: 'npx', args: ['-y', '@upstash/context7-mcp@latest'], required: true },
      { name: 'supabase', command: 'npx', args: ['-y', '@supabase/mcp-server'], required: false }
    ]
  },

  {
    id: 'nextjs-fullstack',
    name: 'Next.js Fullstack',
    description: 'Next.js 15 App Router with Prisma and Tailwind',
    icon: '🌐',
    category: 'fullstack',
    stack: {
      language: 'TypeScript 5.x',
      framework: 'Next.js 15 (App Router)',
      stateManagement: 'Zustand + TanStack Query v5',
      backend: 'Next.js API Routes + Server Actions',
      router: 'App Router (file-based)',
      database: 'PostgreSQL + Prisma',
      styling: 'Tailwind CSS 4 + Radix UI'
    },
    architecture: {
      pattern: 'feature-based with colocation',
      structure: 'app/(features)/{name}/ + lib/{name}/'
    },
    build: {
      setup: 'npm install',
      analyze: 'npx tsc --noEmit && npx next lint',
      test: 'npx vitest run',
      format: 'npx prettier --write .'
    },
    codingRules: [
      'Server Components by default; use "use client" explicitly',
      'Server Actions for form handling',
      'Zod for all input validation',
      'Prisma migrations required for DB changes',
      'No inline styles (Tailwind only)',
      'All API routes must validate input with Zod'
    ],
    forbiddenPatterns: [
      'any type usage',
      'console.log in production code',
      'Direct SQL queries (use Prisma)',
      'Secrets in client components',
      'Synchronous data fetching in Server Components'
    ],
    agents: [
      { fileName: 'product-planner', content: '' },
      { fileName: 'tech-architect', content: '' },
      { fileName: 'task-decomposer', content: '' },
      { fileName: 'nextjs-pages', content: `# nextjs-pages

You are a Next.js page/layout specialist.

## Role
Implement pages, layouts, and route handlers using App Router.

## Rules
- Read the spec from docs/specs/ before implementing
- Use context7 MCP to verify Next.js App Router APIs
- Server Components by default
- Add "use client" only when needed (hooks, event handlers, browser APIs)
- Use generateMetadata for SEO
- Loading.tsx and error.tsx for each route segment
- Parallel routes and intercepting routes when appropriate
- Validate all route params and searchParams with Zod
- Max 100 lines per component (decompose into smaller components)

## Patterns
- Server Components for data fetching
- Suspense boundaries for streaming
- Route groups for layout organization
- Intercepting routes for modals

## Output
app/ directory files` },
      { fileName: 'react-components', content: `# react-components

You are a React component specialist.

## Role
Build reusable UI components with Radix UI + Tailwind.

## Rules
- Read the spec from docs/specs/ before implementing
- Use context7 MCP to verify Radix UI component APIs
- Composition over configuration
- Forward refs for interactive components
- Tailwind CSS for all styling (no inline)
- Accessible by default (Radix primitives)
- Type all props explicitly (no \`any\`)
- Export component props types for consumers
- Max 80 lines per component (decompose into smaller components)

## Patterns
- Compound components for complex UI
- Render props / slots for flexibility
- CVA (class-variance-authority) for variant styling
- forwardRef + ComponentPropsWithoutRef for prop typing

## Output
components/ directory` },
      { fileName: 'prisma-data', content: `# prisma-data

You are a Prisma/database specialist.

## Role
Design data models, write migrations, implement data access.

## Rules
- Read API spec and data models from docs/specs/ first
- Use context7 MCP to verify Prisma Client APIs
- Schema changes require prisma migrate dev
- Use transactions for multi-step operations
- Index frequently queried fields
- Soft deletes where appropriate
- Validate all input with Zod before DB operations
- Create separate Zod schemas mirroring Prisma models
- Environment variables via .env (never hardcode)
- Update docs/api/ after implementation

## Patterns
\`\`\`typescript
// Repository pattern
export async function getProducts(where?: Prisma.ProductWhereInput) {
  return prisma.product.findMany({ where, orderBy: { createdAt: 'desc' } });
}
\`\`\`

## Output
prisma/schema.prisma + lib/db/ directory` },
      { fileName: 'test-writer', content: `# test-writer

You are a Next.js/React test specialist.

## Role
Write unit, component, and integration tests.

## Rules
- Vitest + React Testing Library for components
- MSW (Mock Service Worker) for API mocking
- Arrange/Act/Assert pattern
- Cover: normal flow, edge cases, error cases
- Test Server Components with async rendering
- Test Server Actions with mocked formData
- Test file location: __tests__/{name}/ or colocated {name}.test.tsx
- Naming: {original}.test.ts(x)

## Patterns
\`\`\`typescript
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

describe('Component', () => {
  it('should handle user interaction', async () => {
    // Arrange
    const user = userEvent.setup();
    render(<Component />);
    // Act
    await user.click(screen.getByRole('button'));
    // Assert
    expect(screen.getByText('Result')).toBeInTheDocument();
  });
});
\`\`\`

## Output
Test files + coverage summary` },
      { fileName: 'code-reviewer', content: '' },
      { fileName: 'security-auditor', content: '' },
      { fileName: 'spec-verifier', content: `# spec-verifier

You are a specification compliance verifier.

## Role
Validate that implementation matches the technical spec.

## Verification Areas
1. Data models match Prisma schema definitions in spec
2. API routes match spec endpoints and contracts
3. Server Actions match spec form handling
4. State management (Zustand stores) matches spec
5. Error handling matches spec patterns
6. Routing structure matches spec paths
7. UI component props and behavior match spec

## Output
Alignment report: ✅ Match / ❌ Mismatch / ⚠️ Missing, with details.` },
      { fileName: 'doc-writer', content: '' }
    ],
    commands: [
      { fileName: 'plan-feature', content: `Plan a new feature from scratch.

## Arguments
- $ARGUMENTS — feature name

## Steps
1. Check docs/planningdocs/ for existing planning documents
2. Run product-planner agent → create PRD in docs/prd/$ARGUMENTS.md
3. Wait for user approval
4. Run tech-architect agent → create spec in docs/specs/$ARGUMENTS-spec.md
5. Wait for user approval
6. Run task-decomposer agent → create tasks via TodoWrite
7. Report summary` },
      { fileName: 'implement', content: `Implement a feature based on its technical spec.

## Arguments
- $ARGUMENTS — feature name

## Steps
1. Read docs/specs/$ARGUMENTS-spec.md
2. Load tasks from TodoRead (or decompose if missing)
3. Execute tasks in dependency order using appropriate agents:
   - prisma-data for schema + migrations (npx prisma migrate dev --name $ARGUMENTS)
   - nextjs-pages for routes and layouts
   - react-components for UI components
   - test-writer for tests alongside each task
4. After each task:
   - Run npx tsc --noEmit (type checking)
   - Run npx next lint (linting)
   - Run npx vitest run --reporter=verbose (tests)
5. Report progress and results` },
      { fileName: 'review', content: `Review current branch changes.

## Steps
1. Run code-reviewer, security-auditor, and spec-verifier in parallel
2. Consolidate results with severity counts
3. If any 🔴 Critical → FAIL (block commit)
4. If all clear → PASS
5. Offer to fix issues if found` },
      { fileName: 'full-cycle', content: `Run the complete development cycle for a feature.

## Arguments
- $ARGUMENTS — feature name

## Steps
1. /project:plan-feature $ARGUMENTS (with approval gates)
2. /project:implement $ARGUMENTS
3. /project:review
4. Update documentation
5. Pre-commit validation (npx tsc --noEmit && npx next lint && npx vitest run)
6. Suggest commit message` },
      { fileName: 'retrospective', content: `Run a session retrospective.

## Steps
1. Analyze git diff for this session
2. Identify error patterns and fixes
3. Record new lessons in docs/lessons-learned.md
4. Check for 3x repeat patterns
5. Propose CLAUDE.md updates if needed` }
    ],
    skills: [
      { dirName: 'server-actions', content: `# Server Actions Patterns

## Basic Server Action
\`\`\`typescript
'use server'

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { prisma } from '@/lib/db';

const CreateProductSchema = z.object({
  name: z.string().min(1).max(255),
  price: z.number().positive(),
});

export async function createProduct(formData: FormData) {
  const parsed = CreateProductSchema.safeParse({
    name: formData.get('name'),
    price: Number(formData.get('price')),
  });

  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors };
  }

  await prisma.product.create({ data: parsed.data });
  revalidatePath('/products');
}
\`\`\`

## Form with useActionState
\`\`\`typescript
'use client'

import { useActionState } from 'react';
import { createProduct } from './actions';

export function ProductForm() {
  const [state, action, isPending] = useActionState(createProduct, null);

  return (
    <form action={action}>
      <input name="name" required />
      {state?.error?.name && <p>{state.error.name}</p>}
      <button type="submit" disabled={isPending}>
        {isPending ? 'Creating...' : 'Create'}
      </button>
    </form>
  );
}
\`\`\`

## Optimistic Updates
\`\`\`typescript
'use client'

import { useOptimistic } from 'react';
import { toggleLike } from './actions';

export function LikeButton({ liked, count }: { liked: boolean; count: number }) {
  const [optimistic, setOptimistic] = useOptimistic(
    { liked, count },
    (state, newLiked: boolean) => ({
      liked: newLiked,
      count: state.count + (newLiked ? 1 : -1),
    })
  );

  return (
    <form action={async () => {
      setOptimistic(!optimistic.liked);
      await toggleLike();
    }}>
      <button>{optimistic.liked ? 'Unlike' : 'Like'} ({optimistic.count})</button>
    </form>
  );
}
\`\`\`

## Rules
- Always validate input with Zod
- Use revalidatePath/revalidateTag after mutations
- Return structured errors (not throw) for form validation
- Use useActionState for form state management
- Use useOptimistic for instant UI feedback
- Server Actions must be in files with 'use server' directive` },
      { dirName: 'zustand-patterns', content: `# Zustand Store Patterns with TanStack Query

## Basic Zustand Store
\`\`\`typescript
import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

interface CartState {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (id: string) => void;
  clearCart: () => void;
  totalPrice: () => number;
}

export const useCartStore = create<CartState>()(
  devtools(
    persist(
      immer((set, get) => ({
        items: [],
        addItem: (item) =>
          set((state) => {
            const existing = state.items.find((i) => i.id === item.id);
            if (existing) existing.quantity += 1;
            else state.items.push({ ...item, quantity: 1 });
          }),
        removeItem: (id) =>
          set((state) => {
            state.items = state.items.filter((i) => i.id !== id);
          }),
        clearCart: () => set({ items: [] }),
        totalPrice: () =>
          get().items.reduce((sum, i) => sum + i.price * i.quantity, 0),
      })),
      { name: 'cart-store' }
    )
  )
);
\`\`\`

## Slice Pattern (large stores)
\`\`\`typescript
import { create, StateCreator } from 'zustand';

interface AuthSlice {
  user: User | null;
  login: (user: User) => void;
  logout: () => void;
}

interface UISlice {
  sidebarOpen: boolean;
  toggleSidebar: () => void;
}

const createAuthSlice: StateCreator<AuthSlice & UISlice, [], [], AuthSlice> = (set) => ({
  user: null,
  login: (user) => set({ user }),
  logout: () => set({ user: null }),
});

const createUISlice: StateCreator<AuthSlice & UISlice, [], [], UISlice> = (set) => ({
  sidebarOpen: true,
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
});

export const useAppStore = create<AuthSlice & UISlice>()((...args) => ({
  ...createAuthSlice(...args),
  ...createUISlice(...args),
}));
\`\`\`

## TanStack Query Integration
\`\`\`typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

// Query keys factory
export const productKeys = {
  all: ['products'] as const,
  lists: () => [...productKeys.all, 'list'] as const,
  list: (filters: ProductFilters) => [...productKeys.lists(), filters] as const,
  details: () => [...productKeys.all, 'detail'] as const,
  detail: (id: string) => [...productKeys.details(), id] as const,
};

// Query hook
export function useProducts(filters: ProductFilters) {
  return useQuery({
    queryKey: productKeys.list(filters),
    queryFn: () => fetchProducts(filters),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// Mutation with optimistic update
export function useUpdateProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateProduct,
    onMutate: async (updated) => {
      await queryClient.cancelQueries({ queryKey: productKeys.detail(updated.id) });
      const previous = queryClient.getQueryData(productKeys.detail(updated.id));
      queryClient.setQueryData(productKeys.detail(updated.id), updated);
      return { previous };
    },
    onError: (_err, updated, context) => {
      queryClient.setQueryData(productKeys.detail(updated.id), context?.previous);
    },
    onSettled: (_data, _err, updated) => {
      queryClient.invalidateQueries({ queryKey: productKeys.detail(updated.id) });
    },
  });
}
\`\`\`

## Rules
- Use Zustand for client-only UI state (cart, sidebar, modals)
- Use TanStack Query for server state (API data)
- Never duplicate server state in Zustand
- Use immer middleware for complex nested updates
- Use devtools middleware in development
- Use persist middleware for state that survives refresh
- Use slice pattern for stores with 5+ properties
- Query key factories for consistent cache management` }
    ],
    hooks: {
      PostToolUse: [
        { matcher: 'Edit|Write', command: 'npx prettier --write "$FILE" 2>/dev/null; npx tsc --noEmit 2>&1 | tail -5' }
      ],
      PreToolUse: [
        { matcher: 'Bash', command: 'echo "$COMMAND" | grep -qE "rm -rf|sudo|DROP TABLE|DELETE FROM|truncate|format c:" && echo "BLOCKED" && exit 1 || true' }
      ]
    },
    recommendedMcp: [
      { name: 'context7', command: 'npx', args: ['-y', '@upstash/context7-mcp@latest'], required: true }
    ]
  },

  {
    id: 'python-fastapi',
    name: 'Python + FastAPI',
    description: 'FastAPI backend with SQLAlchemy and PostgreSQL',
    icon: '🐍',
    category: 'backend',
    stack: {
      language: 'Python 3.12+',
      framework: 'FastAPI',
      database: 'PostgreSQL + SQLAlchemy 2.x',
      packages: ['Pydantic v2', 'Alembic', 'python-jose (JWT)', 'pytest']
    },
    architecture: {
      pattern: 'layered (router → service → repository)',
      structure: 'app/{domain}/{router,service,repository,schemas}.py'
    },
    build: {
      setup: 'pip install -r requirements.txt',
      analyze: 'mypy app/ --strict && ruff check app/',
      test: 'pytest -v',
      format: 'ruff format app/'
    },
    codingRules: [
      'Type hints required (strict mypy)',
      'Pydantic models for all request/response schemas',
      'async def by default',
      'Alembic migrations for all DB changes',
      'Dependency injection via FastAPI Depends()',
      'All endpoints must have OpenAPI docstrings'
    ],
    forbiddenPatterns: [
      'Any type or missing type hints',
      'Raw SQL without parameterized queries',
      'Synchronous DB operations',
      'Hardcoded secrets',
      'print() for logging (use logging module)'
    ],
    agents: [
      { fileName: 'product-planner', content: '' },
      { fileName: 'tech-architect', content: '' },
      { fileName: 'task-decomposer', content: '' },
      { fileName: 'fastapi-routes', content: `# fastapi-routes

You are a FastAPI endpoint specialist.

## Role
Implement API endpoints with proper validation and error handling.

## Rules
- Read the spec from docs/specs/ before implementing
- Use context7 MCP to verify FastAPI/Pydantic APIs
- Pydantic models for request/response
- Depends() for dependency injection
- HTTPException for error responses with detail messages
- OpenAPI docstrings for all endpoints
- async def by default
- Return Pydantic response models (not dicts)
- Use status codes from starlette.status
- Group endpoints with APIRouter and tags

## Patterns
\`\`\`python
from fastapi import APIRouter, Depends, HTTPException, status
from app.auth.deps import get_current_user

router = APIRouter(prefix="/products", tags=["products"])

@router.get("/", response_model=list[ProductResponse])
async def list_products(
    skip: int = 0,
    limit: int = 20,
    service: ProductService = Depends(get_product_service),
) -> list[ProductResponse]:
    """List all products with pagination."""
    return await service.get_all(skip=skip, limit=limit)
\`\`\`

## Output
app/{domain}/router.py` },
      { fileName: 'sqlalchemy-models', content: `# sqlalchemy-models

You are a SQLAlchemy/database specialist.

## Role
Design models, write migrations, implement repositories.

## Rules
- Read API spec and data models from docs/specs/ first
- Use context7 MCP to verify SQLAlchemy 2.x async APIs
- SQLAlchemy 2.x async style (AsyncSession, select())
- Alembic for all migrations (alembic revision --autogenerate -m "description")
- Repository pattern for data access
- Index frequently queried columns
- Use transactions for multi-step operations
- Soft deletes where appropriate (deleted_at column)
- Environment variables via .env (never hardcode)
- Update docs/api/ after implementation

## Patterns
\`\`\`python
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

class ProductRepository:
    def __init__(self, session: AsyncSession):
        self._session = session

    async def get_by_id(self, product_id: UUID) -> Product | None:
        result = await self._session.execute(
            select(Product).where(Product.id == product_id)
        )
        return result.scalar_one_or_none()
\`\`\`

## Output
app/{domain}/models.py + alembic/versions/` },
      { fileName: 'pytest-writer', content: `# pytest-writer

You are a Python test specialist.

## Role
Write tests using pytest with async support.

## Rules
- pytest-asyncio for async tests
- Factory Boy for test data
- httpx.AsyncClient for API tests
- Arrange/Act/Assert pattern
- Cover: happy path, edge cases, error cases
- Use fixtures for common setup (conftest.py)
- Test file location: tests/{domain}/
- Naming: test_{original}.py

## Patterns
\`\`\`python
import pytest
from httpx import AsyncClient

@pytest.mark.asyncio
async def test_create_product(client: AsyncClient, auth_headers: dict):
    # Arrange
    payload = {"name": "Widget", "price": 999}
    # Act
    response = await client.post("/api/products", json=payload, headers=auth_headers)
    # Assert
    assert response.status_code == 201
    data = response.json()
    assert data["name"] == "Widget"
\`\`\`

## Output
tests/{domain}/ directory + coverage summary` },
      { fileName: 'code-reviewer', content: '' },
      { fileName: 'security-auditor', content: '' },
      { fileName: 'spec-verifier', content: `# spec-verifier

You are a specification compliance verifier.

## Role
Validate that implementation matches the technical spec.

## Verification Areas
1. Data models match SQLAlchemy model definitions in spec
2. API endpoints match spec routes and contracts
3. Pydantic schemas match spec request/response models
4. Service layer logic matches spec business rules
5. Error handling matches spec patterns
6. Authentication/authorization matches spec requirements
7. Database migrations align with model changes

## Output
Alignment report: ✅ Match / ❌ Mismatch / ⚠️ Missing, with details.` },
      { fileName: 'doc-writer', content: '' }
    ],
    commands: [
      { fileName: 'plan-feature', content: `Plan a new feature from scratch.

## Arguments
- $ARGUMENTS — feature name

## Steps
1. Check docs/planningdocs/ for existing planning documents
2. Run product-planner agent → create PRD in docs/prd/$ARGUMENTS.md
3. Wait for user approval
4. Run tech-architect agent → create spec in docs/specs/$ARGUMENTS-spec.md
5. Wait for user approval
6. Run task-decomposer agent → create tasks via TodoWrite
7. Report summary` },
      { fileName: 'implement', content: `Implement a feature based on its technical spec.

## Arguments
- $ARGUMENTS — feature name

## Steps
1. Read docs/specs/$ARGUMENTS-spec.md
2. Load tasks from TodoRead (or decompose if missing)
3. Execute tasks in dependency order using appropriate agents:
   - sqlalchemy-models for models + migrations (alembic revision --autogenerate -m "$ARGUMENTS")
   - fastapi-routes for API endpoints
   - pytest-writer for tests alongside each task
4. After each task:
   - Run mypy app/ --strict (type checking)
   - Run ruff check app/ (linting)
   - Run pytest -v (tests)
5. Report progress and results` },
      { fileName: 'review', content: `Review current branch changes.

## Steps
1. Run code-reviewer, security-auditor, and spec-verifier in parallel
2. Consolidate results with severity counts
3. If any 🔴 Critical → FAIL (block commit)
4. If all clear → PASS
5. Offer to fix issues if found` },
      { fileName: 'full-cycle', content: `Run the complete development cycle for a feature.

## Arguments
- $ARGUMENTS — feature name

## Steps
1. /project:plan-feature $ARGUMENTS (with approval gates)
2. /project:implement $ARGUMENTS
3. /project:review
4. Update documentation
5. Pre-commit validation (mypy app/ --strict && ruff check app/ && pytest -v)
6. Suggest commit message` },
      { fileName: 'retrospective', content: `Run a session retrospective.

## Steps
1. Analyze git diff for this session
2. Identify error patterns and fixes
3. Record new lessons in docs/lessons-learned.md
4. Check for 3x repeat patterns
5. Propose CLAUDE.md updates if needed` }
    ],
    skills: [
      { dirName: 'pydantic-patterns', content: `# Pydantic v2 Model Patterns

## Base Model with Config
\`\`\`python
from pydantic import BaseModel, ConfigDict, Field
from datetime import datetime
from uuid import UUID

class BaseSchema(BaseModel):
    model_config = ConfigDict(
        from_attributes=True,  # ORM mode (replaces orm_mode)
        str_strip_whitespace=True,
        strict=False,
    )

class ProductCreate(BaseSchema):
    name: str = Field(..., min_length=1, max_length=255)
    price: int = Field(..., gt=0, description="Price in cents")
    category: str | None = None

class ProductResponse(BaseSchema):
    id: UUID
    name: str
    price: int
    category: str | None
    created_at: datetime
    updated_at: datetime
\`\`\`

## Custom Validators
\`\`\`python
from pydantic import BaseModel, field_validator, model_validator

class UserCreate(BaseModel):
    email: str
    password: str
    password_confirm: str

    @field_validator('email')
    @classmethod
    def validate_email(cls, v: str) -> str:
        if '@' not in v:
            raise ValueError('Invalid email format')
        return v.lower()

    @model_validator(mode='after')
    def validate_passwords_match(self) -> 'UserCreate':
        if self.password != self.password_confirm:
            raise ValueError('Passwords do not match')
        return self
\`\`\`

## Settings with Environment Variables
\`\`\`python
from pydantic_settings import BaseSettings
from functools import lru_cache

class Settings(BaseSettings):
    model_config = ConfigDict(env_file='.env', env_file_encoding='utf-8')

    database_url: str
    secret_key: str
    debug: bool = False
    cors_origins: list[str] = ["http://localhost:3000"]

@lru_cache
def get_settings() -> Settings:
    return Settings()
\`\`\`

## Discriminated Unions
\`\`\`python
from pydantic import BaseModel
from typing import Literal, Annotated
from pydantic import Discriminator

class EmailNotification(BaseModel):
    type: Literal['email'] = 'email'
    to: str
    subject: str

class SMSNotification(BaseModel):
    type: Literal['sms'] = 'sms'
    phone: str
    message: str

Notification = Annotated[
    EmailNotification | SMSNotification,
    Discriminator('type'),
]
\`\`\`

## Rules
- Always use Pydantic v2 syntax (model_config, not class Config)
- from_attributes=True for ORM integration
- Field() for validation constraints and descriptions
- @field_validator for single field validation
- @model_validator for cross-field validation
- Use pydantic-settings for environment configuration
- Separate schemas: Create (input), Update (partial), Response (output)
- Never expose internal fields (password_hash) in Response schemas` },
      { dirName: 'sqlalchemy-patterns', content: `# SQLAlchemy 2.x Async Patterns

## Base Model
\`\`\`python
from sqlalchemy import MetaData
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column
from datetime import datetime
from uuid import UUID, uuid4

convention = {
    "ix": "ix_%(column_0_label)s",
    "uq": "uq_%(table_name)s_%(column_0_name)s",
    "ck": "ck_%(table_name)s_%(constraint_name)s",
    "fk": "fk_%(table_name)s_%(column_0_name)s_%(referred_table_name)s",
    "pk": "pk_%(table_name)s",
}

class Base(DeclarativeBase):
    metadata = MetaData(naming_convention=convention)

class TimestampMixin:
    created_at: Mapped[datetime] = mapped_column(default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(
        default=datetime.utcnow, onupdate=datetime.utcnow
    )

class SoftDeleteMixin:
    deleted_at: Mapped[datetime | None] = mapped_column(default=None)
\`\`\`

## Model Definition
\`\`\`python
from sqlalchemy import ForeignKey, String, Index
from sqlalchemy.orm import Mapped, mapped_column, relationship
from uuid import UUID, uuid4

class Product(Base, TimestampMixin, SoftDeleteMixin):
    __tablename__ = "products"

    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    name: Mapped[str] = mapped_column(String(255))
    price: Mapped[int]
    category_id: Mapped[UUID] = mapped_column(ForeignKey("categories.id"))

    category: Mapped["Category"] = relationship(back_populates="products")
    tags: Mapped[list["Tag"]] = relationship(
        secondary="product_tags", back_populates="products"
    )

    __table_args__ = (
        Index("ix_products_category_id", "category_id"),
    )
\`\`\`

## Async Session Setup
\`\`\`python
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession

engine = create_async_engine(settings.database_url, echo=settings.debug)
async_session = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

async def get_session() -> AsyncGenerator[AsyncSession, None]:
    async with async_session() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
\`\`\`

## Repository Pattern
\`\`\`python
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

class ProductRepository:
    def __init__(self, session: AsyncSession):
        self._session = session

    async def get_by_id(self, product_id: UUID) -> Product | None:
        result = await self._session.execute(
            select(Product).where(
                Product.id == product_id,
                Product.deleted_at.is_(None),
            )
        )
        return result.scalar_one_or_none()

    async def get_all(
        self, skip: int = 0, limit: int = 20
    ) -> list[Product]:
        result = await self._session.execute(
            select(Product)
            .where(Product.deleted_at.is_(None))
            .offset(skip)
            .limit(limit)
            .order_by(Product.created_at.desc())
        )
        return list(result.scalars().all())

    async def create(self, **kwargs) -> Product:
        product = Product(**kwargs)
        self._session.add(product)
        await self._session.flush()
        return product

    async def soft_delete(self, product_id: UUID) -> None:
        product = await self.get_by_id(product_id)
        if product:
            product.deleted_at = datetime.utcnow()
\`\`\`

## FastAPI Dependency Injection
\`\`\`python
from fastapi import Depends

async def get_product_service(
    session: AsyncSession = Depends(get_session),
) -> ProductService:
    repo = ProductRepository(session)
    return ProductService(repo)
\`\`\`

## Rules
- Always use SQLAlchemy 2.x Mapped[] type annotations
- Use mapped_column() instead of Column()
- AsyncSession for all database operations
- Repository pattern to isolate DB logic from business logic
- Naming conventions for consistent constraint names
- Alembic for all migrations (never raw SQL DDL)
- expire_on_commit=False for async sessions
- Use select() instead of legacy Query API
- Soft deletes: filter deleted_at.is_(None) in all queries` }
    ],
    hooks: {
      PostToolUse: [
        { matcher: 'Edit|Write', command: 'ruff format "$FILE" 2>/dev/null; ruff check "$FILE" 2>&1 | tail -5' }
      ],
      PreToolUse: [
        { matcher: 'Bash', command: 'echo "$COMMAND" | grep -qE "rm -rf|sudo|DROP TABLE|DELETE FROM|truncate|format c:" && echo "BLOCKED" && exit 1 || true' }
      ]
    },
    recommendedMcp: [
      { name: 'context7', command: 'npx', args: ['-y', '@upstash/context7-mcp@latest'], required: true }
    ]
  },

  {
    id: 'custom',
    name: 'Custom',
    description: 'Start with base agents only, configure everything yourself',
    icon: '✏️',
    category: 'custom',
    stack: { language: '', framework: '' },
    architecture: { pattern: '', structure: '' },
    build: { setup: '' },
    codingRules: [],
    forbiddenPatterns: [],
    agents: [
      { fileName: 'product-planner', content: '' },
      { fileName: 'tech-architect', content: '' },
      { fileName: 'task-decomposer', content: '' },
      { fileName: 'code-reviewer', content: '' },
      { fileName: 'doc-writer', content: '' }
    ],
    commands: [
      { fileName: 'plan-feature', content: 'Plan a feature.' },
      { fileName: 'review', content: 'Review current changes.' }
    ],
    skills: [],
    hooks: {},
    recommendedMcp: [
      { name: 'context7', command: 'npx', args: ['-y', '@upstash/context7-mcp@latest'], required: true }
    ]
  }
]

// Fill in base agent content for presets that left it empty
for (const preset of PRESETS) {
  const stackDesc = Object.entries(preset.stack)
    .filter(([, v]) => v)
    .map(([k, v]) => `- ${k}: ${Array.isArray(v) ? v.join(', ') : v}`)
    .join('\n')
  const archDesc = `${preset.architecture.pattern}\nStructure: ${preset.architecture.structure}`
  const rulesDesc = preset.codingRules.map((r) => `- ${r}`).join('\n')

  for (const agent of preset.agents) {
    if (agent.content) continue
    switch (agent.fileName) {
      case 'product-planner':
        agent.content = BASE_AGENTS.productPlanner(stackDesc)
        break
      case 'tech-architect':
        agent.content = BASE_AGENTS.techArchitect(stackDesc, archDesc)
        break
      case 'task-decomposer':
        agent.content = BASE_AGENTS.taskDecomposer()
        break
      case 'code-reviewer':
        agent.content = BASE_AGENTS.codeReviewer(rulesDesc)
        break
      case 'security-auditor':
        agent.content = BASE_AGENTS.securityAuditor()
        break
      case 'doc-writer':
        agent.content = BASE_AGENTS.docWriter()
        break
    }
  }
}

export function getPreset(id: string): TechStackPreset | undefined {
  return PRESETS.find((p) => p.id === id) ?? userPresets.find((p) => p.id === id)
}

export function listPresets(): TechStackPreset[] {
  return [...PRESETS, ...userPresets]
}

// ── User custom presets (imported) ──

const userPresets: TechStackPreset[] = []

export function addUserPreset(preset: TechStackPreset): void {
  const idx = userPresets.findIndex((p) => p.id === preset.id)
  if (idx >= 0) {
    userPresets[idx] = preset
  } else {
    userPresets.push(preset)
  }
}

export function removeUserPreset(id: string): void {
  const idx = userPresets.findIndex((p) => p.id === id)
  if (idx >= 0) userPresets.splice(idx, 1)
}
