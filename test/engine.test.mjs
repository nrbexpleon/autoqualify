import test from 'node:test';
import assert from 'node:assert/strict';
import { assess, normalizeSbom, validateInput } from '../src/engine.mjs';

const component={name:'Diagnostics Service',version:'1.0.0',intendedUse:'Vehicle diagnostics on a non-safety partition'};
const full={threatModel:true,vulnerabilityPolicy:true,secureUpdate:true,interfaceSpecification:true,contractTests:true,platformMatrix:true,integrationGuide:true,testReport:true,testCoverage:90,staticAnalysis:true,regressionSuite:true,requirementsTraceability:true,licenseDeclaration:true,aspiceEvidence:true,iso21434Evidence:true,safetyImpactAssessment:true,dataPrivacyAssessment:true,performanceBenchmarks:true,operationalMonitoring:true,rollbackPlan:true,supportPolicy:true,releaseNotes:true};

test('recognizes CycloneDX',()=>assert.equal(normalizeSbom({bomFormat:'CycloneDX',components:[{}]}).componentCount,undefined));
test('validates required component fields',()=>assert.equal(validateInput({component}).length,0));
test('complete evidence is ready for review',()=>{const r=assess({component,sbom:{bomFormat:'CycloneDX',components:[{name:'lib'}]},evidence:full});assert.equal(r.overall,100);assert.equal(r.decision,'READY_FOR_EXPERT_REVIEW');assert.equal(r.blockers,0);});
test('missing evidence creates hold and blockers',()=>{const r=assess({component,evidence:{}});assert.equal(r.decision,'HOLD');assert.ok(r.blockers>=3);assert.ok(r.overall<50);});
test('critical vulnerability blocks qualification',()=>{const r=assess({component,sbom:{bomFormat:'CycloneDX',components:[]},vulnerabilities:{critical:1},evidence:full});assert.equal(r.decision,'HOLD');assert.ok(r.findings.some(x=>x.severity==='critical'));});
