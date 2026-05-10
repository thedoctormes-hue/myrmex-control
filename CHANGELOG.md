# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - 2026-05-10

### Added
- Initial release
- Dashboard with balance, server status, and signals feed widgets
- Drag-and-drop Kanban board with customizable columns
- Project management (create, organize, track)
- Library for skills, hooks, and agent configurations
- File exchange with inbox/outbox
- Cookie-based authentication with bcrypt password hashing
- Rate limiting (100 requests/minute per IP)
- Security headers (CSP, HSTS, X-Frame-Options via Helmet)
- Multi-language support (English, Russian, Chinese)
- Demo mode without authentication
- Health check endpoint
- GitHub Actions CI workflow

### Security
- Bcrypt password hashing (replacing plaintext)
- Helmet security headers
- CORS origin restriction
- HttpOnly cookies with SameSite

### Fixed
- TypeScript path aliases for `@shared/types`
- Build process for client and server separation