const WEIGHTS = { cybersecurity: .25, interoperability: .20, quality: .20, compliance: .20, production: .15 };
const clamp = n => Math.max(0, Math.min(100, Math.round(n)));
const finding = (severity, area, title, action, blocker = false) => ({ severity, area, title, action, blocker });

export function normalizeSbom(sbom) {
  if (!sbom || typeof sbom !== 'object') return { format: 'none', components: [], vulnerabilities: [] };
  if (sbom.bomFormat === 'CycloneDX') return {
    format: 'CycloneDX',
    components: Array.isArray(sbom.components) ? sbom.components : [],
    vulnerabilities: Array.isArray(sbom.vulnerabilities) ? sbom.vulnerabilities : []
  };
  if (String(sbom.spdxVersion || '').startsWith('SPDX-')) return {
    format: 'SPDX',
    components: Array.isArray(sbom.packages) ? sbom.packages : [],
    vulnerabilities: Array.isArray(sbom.vulnerabilities) ? sbom.vulnerabilities : []
  };
  return { format: 'unknown', components: [], vulnerabilities: [] };
}

function severityCounts(vulnerabilities, declared = {}) {
  const counts = { critical: Number(declared.critical || 0), high: Number(declared.high || 0), medium: Number(declared.medium || 0), low: Number(declared.low || 0) };
  for (const v of vulnerabilities) {
    const rating = v.ratings?.[0]?.severity || v.severity || '';
    const key = String(rating).toLowerCase();
    if (key in counts) counts[key] += 1;
  }
  return counts;
}

export function assess(input) {
  const e = input.evidence || {};
  const sbom = normalizeSbom(input.sbom);
  const vulns = severityCounts(sbom.vulnerabilities, input.vulnerabilities);
  const findings = [];
  let cybersecurity = 100, interoperability = 100, quality = 100, compliance = 100, production = 100;

  if (sbom.format === 'none' || sbom.format === 'unknown') { cybersecurity -= 35; compliance -= 10; findings.push(finding('high','Cybersecurity','Valid SBOM is missing','Provide CycloneDX or SPDX SBOM.',true)); }
  if (vulns.critical) { cybersecurity -= vulns.critical * 25; findings.push(finding('critical','Cybersecurity',`${vulns.critical} critical vulnerabilities declared`,'Remediate or document approved exception.',true)); }
  if (vulns.high) { cybersecurity -= vulns.high * 10; findings.push(finding('high','Cybersecurity',`${vulns.high} high vulnerabilities declared`,'Remediate and rerun qualification.')); }
  cybersecurity -= vulns.medium * 3;
  if (!e.threatModel) { cybersecurity -= 20; findings.push(finding('medium','Cybersecurity','Threat model not supplied','Provide TARA/threat model and mitigations.')); }
  if (!e.vulnerabilityPolicy) { cybersecurity -= 15; findings.push(finding('medium','Cybersecurity','Vulnerability response policy missing','Define disclosure, remediation SLA and monitoring.')); }
  if (!e.secureUpdate) { cybersecurity -= 15; findings.push(finding('high','Cybersecurity','Secure update evidence missing','Provide signing, verification and rollback controls.')); }

  if (!e.interfaceSpecification) { interoperability -= 30; findings.push(finding('high','Interoperability','Interface specification missing','Provide APIs, ARXML/IDL and error behaviour.',true)); }
  if (!e.contractTests) { interoperability -= 25; findings.push(finding('medium','Interoperability','Contract tests missing','Provide executable interface conformance tests.')); }
  if (!e.platformMatrix) { interoperability -= 25; findings.push(finding('medium','Interoperability','Platform compatibility matrix missing','List supported OS, hardware, middleware and versions.')); }
  if (!e.integrationGuide) interoperability -= 20;

  const coverage = Number(e.testCoverage || 0);
  if (!e.testReport) { quality -= 30; findings.push(finding('high','Quality','Independent test report missing','Provide test scope, environment, results and anomalies.',true)); }
  if (coverage < 60) { quality -= 25; findings.push(finding('medium','Quality',`Declared coverage is ${coverage}%`,'Raise coverage and explain exclusions.')); }
  else if (coverage < 80) quality -= 10;
  if (!e.staticAnalysis) quality -= 15;
  if (!e.regressionSuite) quality -= 20;
  if (!e.requirementsTraceability) quality -= 15;

  if (!e.licenseDeclaration) { compliance -= 25; findings.push(finding('high','Compliance','License declaration missing','Provide licenses and obligations for all dependencies.',true)); }
  if (!e.aspiceEvidence) compliance -= 20;
  if (!e.iso21434Evidence) compliance -= 20;
  if (!e.safetyImpactAssessment) { compliance -= 25; findings.push(finding('medium','Compliance','Safety impact assessment missing','Document safety relevance and integration assumptions.')); }
  if (!e.dataPrivacyAssessment) compliance -= 10;

  if (!e.performanceBenchmarks) { production -= 25; findings.push(finding('medium','Production','Performance benchmarks missing','Provide CPU, memory, latency and startup measurements.')); }
  if (!e.operationalMonitoring) production -= 20;
  if (!e.rollbackPlan) production -= 20;
  if (!e.supportPolicy) { production -= 20; findings.push(finding('medium','Production','Support policy missing','Define support period, SLA and end-of-life policy.')); }
  if (!e.releaseNotes) production -= 15;

  const scores = {
    cybersecurity: clamp(cybersecurity), interoperability: clamp(interoperability), quality: clamp(quality),
    compliance: clamp(compliance), production: clamp(production)
  };
  const overall = clamp(Object.entries(WEIGHTS).reduce((sum,[k,w]) => sum + scores[k] * w, 0));
  const blockers = findings.filter(f => f.blocker);
  const decision = blockers.length ? 'HOLD' : overall >= 85 ? 'READY_FOR_EXPERT_REVIEW' : overall >= 70 ? 'CONDITIONAL' : 'NOT_READY';
  return {
    schemaVersion: '1.0', generatedAt: new Date().toISOString(), component: input.component || {}, sbomSummary: {
      format: sbom.format, componentCount: sbom.components.length, vulnerabilities: vulns
    }, scores, overall, decision, findings: findings.sort((a,b) => ['critical','high','medium','low'].indexOf(a.severity) - ['critical','high','medium','low'].indexOf(b.severity)),
    blockers: blockers.length, disclaimer: 'Decision support only. Qualification requires evidence validation and approval by a competent human reviewer.'
  };
}

export function validateInput(input) {
  const errors = [];
  if (!input?.component?.name?.trim()) errors.push('Component name is required.');
  if (!input?.component?.version?.trim()) errors.push('Component version is required.');
  if (!input?.component?.intendedUse?.trim()) errors.push('Intended use is required.');
  return errors;
}
