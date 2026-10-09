# AutoQualify

Evidence-based qualification workbench for reusable automotive software components.

AutoQualify helps OEM and Tier-1 engineering teams evaluate third-party software before integration. It produces transparent readiness scores and evidence gaps across interoperability, cybersecurity, compliance, quality, and production readiness.

## MVP capabilities

- Component intake and intended-use classification
- CycloneDX/SPDX SBOM ingestion and validation
- Dependency, license, vulnerability, interface, test, and compliance evidence capture
- Explainable risk rules—no opaque AI verdict
- Five qualification dimensions with weighted scoring
- Blocking findings, evidence gaps, and remediation actions
- Human reviewer approval workflow
- Downloadable JSON and printable qualification report
- Local file-backed persistence for development
- REST API and responsive browser UI
- Automated unit tests and Docker/Azure deployment assets

## Safety boundary

This MVP is a decision-support tool. It does not certify functional safety, cybersecurity compliance, or production suitability. A qualified human reviewer must validate source evidence and approve every assessment.

## Run locally

Requires Node.js 20 or later.

```bash
npm test
npm start
```

Open http://localhost:3000.

## API

- `GET /api/health`
- `POST /api/assessments`
- `GET /api/assessments/:id`
- `POST /api/assessments/:id/review`
- `GET /api/assessments/:id/report`

## Deploy

Build a container using the included `Dockerfile`, or deploy `infra/main.bicep` to Azure and ZIP-deploy `package.json`, `src`, and `public`.

See [docs/qualification-model.md](docs/qualification-model.md) for scoring logic and evidence expectations.
