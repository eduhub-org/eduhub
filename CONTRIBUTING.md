# Contributing to EduHub

We welcome contributions to EduHub! This guide will help you understand our development process and release management.

## Development Workflow

### Branch Structure

Our project uses a three-branch workflow:

- **`develop`** - Main development branch
  - All feature branches merge here
  - Creates development releases (e.g., `0.1.0-dev.1`, `0.1.0-dev.2`)
  - Automatically deployed to development environment

- **`staging`** - Pre-production testing branch
  - PRs from `develop` to `staging` for release candidates
  - Creates release candidate versions (e.g., `0.1.0-rc.1`, `0.1.0-rc.2`) 
  - Automatically deployed to staging environment
  - Used for final testing before production

- **`production`** - Production releases
  - PRs from `staging` to `production` for final releases
  - Creates final release versions (e.g., `0.1.0`, `0.2.0`)
  - Automatically deployed to production environment

### Release Flow

1. **Development**: Feature branches → `develop` → `0.1.0-dev.x`
2. **Staging**: PR `develop` → `staging` → `0.1.0-rc.x` 
3. **Production**: PR `staging` → `production` → `0.1.0`

## Commit Message Guidelines

We use [Conventional Commits](https://www.conventionalcommits.org/) for automated version management and changelog generation.

### Commit Message Format

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

### Types

- **feat**: A new feature (triggers minor version bump)
- **fix**: A bug fix (triggers patch version bump)
- **docs**: Documentation only changes
- **style**: Changes that do not affect the meaning of the code (white-space, formatting, etc)
- **refactor**: A code change that neither fixes a bug nor adds a feature
- **perf**: A code change that improves performance
- **test**: Adding missing tests or correcting existing tests
- **build**: Changes that affect the build system or external dependencies
- **ci**: Changes to our CI configuration files and scripts
- **chore**: Other changes that don't modify src or test files

### Breaking Changes

For breaking changes, add `BREAKING CHANGE:` in the footer or use `!` after the type:

```
feat!: remove deprecated API endpoints

BREAKING CHANGE: The legacy v1 API endpoints have been removed. Use v2 endpoints instead.
```

Breaking changes trigger a major version bump.

### Examples

#### Good Commit Messages

```bash
feat(auth): add OAuth2 integration with Keycloak
fix(frontend): resolve table pagination issue
docs: update API documentation for user endpoints
refactor(backend): optimize database queries
perf(frontend): implement virtual scrolling for large lists
test(api): add integration tests for user registration
```

#### Bad Commit Messages

```bash
update stuff
fix bug
changes
wip
```

### Scopes

Common scopes in our project:
- `frontend`: Frontend/UI changes
- `backend`: Backend/API changes  
- `auth`: Authentication/authorization
- `api`: API changes
- `db`: Database changes
- `docs`: Documentation
- `ci`: CI/CD changes
- `infra`: Infrastructure changes

## Pull Request Process

1. **Create Feature Branch**: Branch from `develop`
   ```bash
   git checkout develop
   git pull origin develop
   git checkout -b feature/your-feature-name
   ```

2. **Make Changes**: Follow our coding standards and commit message guidelines

3. **Test Your Changes**: Ensure all tests pass
   ```bash
   # From project root or frontend-nx directory
   pnpm test
   pnpm build
   ```

4. **Create Pull Request**: Target the `develop` branch
   - Use descriptive title and description
   - Reference any related issues
   - Ensure CI checks pass

5. **Code Review**: Address feedback from maintainers

6. **Merge**: Squash and merge with conventional commit message

## Release Process

### Automated Releases

Our release process is fully automated using [semantic-release](https://semantic-release.gitbook.io/):

- **Commits to `develop`**: Creates development releases (`0.1.0-dev.x`)
- **PRs to `staging`**: Creates release candidates (`0.1.0-rc.x`)
- **PRs to `production`**: Creates final releases (`0.1.0`)

### Manual Release Steps

#### Staging Release
1. Create PR from `develop` to `staging`
2. Review and merge PR
3. Automated release creates `x.x.x-rc.1`
4. Test on staging environment
5. If issues found, fix on `develop` and create new PR to `staging`

#### Production Release  
1. Create PR from `staging` to `production`
2. Review and merge PR
3. Automated release creates `x.x.x`
4. Monitor production deployment

### Version Bumping

Versions are automatically determined based on commit messages:

- **Patch** (0.1.0 → 0.1.1): `fix:` commits
- **Minor** (0.1.0 → 0.2.0): `feat:` commits  
- **Major** (0.1.0 → 1.0.0): `BREAKING CHANGE:` commits

## Development Setup

1. **Clone Repository**
   ```bash
   git clone https://github.com/edu-hub-project/application.git
   cd application
   ```

2. **Install Dependencies**
   ```bash
   # From project root (recommended)
   pnpm install
   
   # Or from frontend directory
   cd frontend-nx
   pnpm install
   ```

3. **Start Development Environment**
   ```bash
   # From project root
   docker compose up
   ```

4. **Access Application**
   - Frontend: http://localhost:5000
   - Login: admin@example.com / dev

## Code Style

- **Frontend**: ESLint + Prettier configuration
- **Commits**: Conventional Commits format
- **TypeScript**: Strict mode enabled
- **Testing**: Jest for unit tests, Cypress for E2E

## Getting Help

- **Documentation**: Check `/docs` directory
- **Issues**: Create GitHub issue for bugs/features
- **Questions**: Use GitHub Discussions

## License

By contributing, you agree that your contributions will be licensed under the AGPLv3 License.