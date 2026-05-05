# Security Notes

This MVP now includes the baseline controls needed for a public validation launch:

- JWT secret validation at startup.
- Tenant-scoped API queries through `business_id`.
- CORS allowlist through `CORS_ORIGINS`.
- Helmet security headers.
- API rate limiting.
- JSON body size limit.
- Production error response redaction.
- Production seed-data guard.

Before handling real sensitive customer data:

- Add email verification and password reset.
- Add audit logs for messages, settings, and task updates.
- Add backups and restore testing for the database.
- Add a privacy policy and terms of service.
- Add role-based permissions for staff users.
- Move secrets to the hosting provider secret manager.
- Configure a real LLM provider with data-retention settings appropriate for your customers.
