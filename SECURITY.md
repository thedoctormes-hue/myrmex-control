# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 1.1.x   | :white_check_mark: |
| 1.0.x   | :white_check_mark: |
| 0.1.x   | :x:                |

## Reporting a Vulnerability

We take security seriously. If you discover a security vulnerability, please report it responsibly.

**Please do NOT open a public issue for security vulnerabilities.**

Instead, email the maintainers directly or use GitHub's security advisory feature.

### What to Include

- Description of the vulnerability
- Steps to reproduce
- Potential impact
- Suggested fix (if any)

### Response Time

- Initial response within 48 hours
- Status update within 7 days
- Fix timeline depends on severity

## Security Measures

- Passwords are hashed with bcrypt
- Rate limiting (100 requests/minute/IP)
- Security headers (CSP, HSTS, X-Frame-Options)
- HttpOnly cookies with SameSite

Thank you for helping keep Myrmex Control secure!