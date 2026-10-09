# Qualification model

AutoQualify scores five dimensions:

| Dimension | Weight | Typical evidence |
|---|---:|---|
| Cybersecurity | 25% | SBOM, vulnerabilities, threat model, secure update, response policy |
| Interoperability | 20% | API/ARXML/IDL, contract tests, platform matrix, integration guide |
| Quality | 20% | Independent test report, coverage, static analysis, regression, traceability |
| Compliance | 20% | Licenses, ASPICE, ISO 21434, safety impact, privacy assessment |
| Production readiness | 15% | Benchmarks, monitoring, rollback, support and release policy |

## Decisions

- **HOLD** — one or more blocking evidence gaps or critical vulnerabilities.
- **READY_FOR_EXPERT_REVIEW** — score at least 85, with no blockers.
- **CONDITIONAL** — score 70–84, with no blockers.
- **NOT_READY** — score below 70, with no blockers.

A tool score is not certification. Reviewers must inspect the evidence, component assumptions, vehicle context, safety relevance, supplier claims, and residual risks.

## Production hardening backlog

1. Entra/OIDC authentication and role-based access.
2. Azure SQL/PostgreSQL and immutable audit log.
3. Scanner workers for Syft/Grype/Trivy and approved static-analysis tools.
4. Evidence signatures, provenance, retention and deletion controls.
5. Tenant isolation and encryption with customer-managed keys.
6. Configurable qualification policies by OEM/programme.
7. Signed PDF report and marketplace integration APIs.
