export interface HermesSkillCandidate {
  name: string;
  path: string;
  sourceRelativePath: string;
  description: string;
  files: { path: string; bytes: number; mode: string; sha256: string }[];
  fingerprint: string;
  warnings: string[];
  action: string;
  provenance: {
    classification: 'recorded-local-creation' | 'source-uncertain';
    reason: string;
    hints: { createdBy: unknown; createdAt: unknown };
    evidence: {
      ledgerEntryId: string;
      actor: 'agent' | 'user' | 'curator';
      timestamp: string;
      sourceRelativePath: string;
    } | null;
  };
}

export interface HermesSkillInventory {
  root: string;
  candidates: HermesSkillCandidate[];
  excluded: {
    path: string;
    sourceRelativePath: string;
    name: string | null;
    reason: string;
  }[];
  warnings: string[];
}

export function scanHermesSkills(options?: {
  hermesHome?: string;
}): HermesSkillInventory;
