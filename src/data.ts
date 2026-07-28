export interface Feature {
  name: string;
  value: string;
  shap: number;
  description: string;
}

export interface Applicant {
  id: number;
  displayId: string;
  label: string;
  prob: number;
  totalRisk: number;
  features: Feature[];
  rawFeatures: Record<string, string>;
  summary: { k: string; v: string }[];
}

import newApplicantsData from '../new_applicants.json';

// Human-readable feature descriptions for SHAP plot tooltips
const FEATURE_DESCRIPTIONS: Record<string, string> = {
  checking_account: 'Status of existing checking account',
  duration: 'Duration of the loan in months',
  credit_history: 'History of previous credit payments',
  purpose: 'Reason for the loan request',
  credit_amount: 'Total amount of credit requested',
  savings: 'Balance in savings account',
  employment_since: 'Duration of current employment',
  installment_rate: 'Installment rate as % of disposable income',
  personal_status: 'Personal status and sex',
  guarantors: 'Other debtors or guarantors',
  residence_since: 'Present residence since (years)',
  property: 'Most valuable property owned',
  age: 'Age of the applicant',
  installment_plans: 'Other installment plans',
  housing: 'Type of housing',
  existing_credits: 'Number of existing credits',
  job: 'Type of employment',
  liable_people: 'Number of dependents',
  telephone: 'Telephone in applicant\'s name',
  foreign_worker: 'Foreign worker status',
};

function enrichApplicants(raw: Applicant[]): Applicant[] {
  return raw.map((a) => {
    const hasDuration = a.summary.some(s => s.k.toLowerCase() === 'duration');
    const newSummary = [...a.summary];
    if (!hasDuration && a.rawFeatures['duration']) {
      newSummary.push({ k: 'Duration', v: `${a.rawFeatures['duration']} Months` });
    }

    return {
      ...a,
      features: a.features.map((f) => {
        const key = f.description?.replace('Attribute: ', '').toLowerCase().replace(/\s/g, '_') || f.name.toLowerCase().replace(/\s/g, '_');
        const description = FEATURE_DESCRIPTIONS[key] || f.description || f.name;
        return { ...f, description, value: f.value.replace(/DM/g, '€') };
      }),
      summary: newSummary.map(s => ({ ...s, v: s.v.replace(/DM/g, '€') })),
    };
  });
}

// Load applicants from new_applicants.json (20 features from ML model)
// Generate with: python train_loan_model.py
export const APPLICANTS: Applicant[] = enrichApplicants(newApplicantsData as Applicant[]);

// The 3 *rejected* applicants whose rejection probability is closest to 50%.
// "Rejected" matches the app logic: typically `prob > 0.50`.
export const EXPERIMENT_APPLICANTS: Applicant[] = (() => {
  const rejected = APPLICANTS.filter((a) => a.prob > 0.5);
  const sorted = [...rejected].sort((a, b) => Math.abs(a.prob - 0.5) - Math.abs(b.prob - 0.5));
  return sorted.slice(0, 3);
})();
