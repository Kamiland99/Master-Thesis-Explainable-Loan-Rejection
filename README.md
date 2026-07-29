# Explainable Loan Rejection: Static vs. Conversational XAI

This repository contains the companion code for the Master's thesis:

> **Kamil Andrzejewski** — *Conversational XAI: Comparing Static and Conversational
> Explanations of Automated Loan Rejections*
> Master's thesis, MSc Business Informatics (Masterstudium Wirtschaftsinformatik),
> University of Vienna (Universität Wien), 2026.

It provides the complete experimental environment used in the study: a React-based
web application presenting two explanation interfaces, and a Python pipeline that
trains the underlying credit-risk model and generates the applicant data with SHAP
attributions. The repository is released to support transparency and reproducibility,
and to allow the study environment to be inspected and reused.

The study compares two ways of explaining an automated loan rejection to
non-technical users: a **static SHAP visualisation** and a **conversational,
LLM-based assistant** grounded in the same model outputs. Full methodology and
results are reported in the thesis.

---

## 1. Web Application Setup (React)

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher)
- [npm](https://www.npmjs.com/)

### Installation
1. Navigate to the project root directory.
2. Install dependencies:
```bash
   npm install
```
3. Create the environment file and add your Gemini API key:
```bash
   touch .env
```
   Then edit `.env` and add your API key:
```env
   GEMINI_API_KEY=your_actual_api_key_here
```

### Running the App
Start the development server:
```bash
npm run dev
```
The app will be available at `http://localhost:3000`.

---

## 2. Model Retraining (Python)

If you want to retrain the model or adjust the applicant cases, use the provided
`train_loan_model.py` script.

### Prerequisites
- [Python 3.8+](https://www.python.org/)
- `pip` (Python package manager)

### Installation
1. Install the required Python libraries:
```bash
   pip install -r requirements.txt
```

### Retraining
1. The `german.data` file (from the UCI German Credit Database) is stored in the root directory.
2. Run the training script:
```bash
   python train_loan_model.py
```
3. The script automatically generates and updates the `new_applicants.json` root file.
4. The React application automatically imports this JSON file in `src/data.ts` with no
   manual intervention required. The setup processes all 1,000 cases to dynamically
   identify the 3 borderline applicants used in the experiment (the rejected cases whose
   predicted probability is closest to the 50% threshold).

---

## 3. The Experiment Design

This application was built to evaluate different methods of Explainable AI (XAI) for the
thesis described above.

### Experimental Conditions
- **Condition A (Static Analysis):** Users are presented with a visual SHAP (SHapley
  Additive exPlanations) plot showing the mathematical contribution of each feature to
  the final risk score, using colour-coded bars (red for increasing risk, blue for
  decreasing risk).
- **Condition B (Conversational Analysis):** Users interact with an AI assistant
  (powered by Google Gemini). The assistant uses "Progressive Disclosure" to explain the
  decision step by step, allowing the user to ask follow-up questions.

### Data Source
The experiment uses the **German Credit Database** (UCI Machine Learning Repository),
which contains 1,000 credit applications classified as "Good" or "Bad" risk based on
20 attributes.

### Key Features
- **Researcher Mode (Data Explorer):** A dedicated interface to browse all applicants and
  their SHAP plots, used to review the model's output after retraining and verify the
  selected borderline cases.
- **Randomisation:** The presentation order of the applicants is shuffled for each
  participant to avoid order effects.
- **Progress Tracking:** A progress bar shows the participant's position in the experiment.
- **Data Export:** For Condition B, the application generates a PDF of the chat history at
  the end of the session for qualitative analysis.

---

## Project Structure
- `src/` — React source code.
- `src/data.ts` — the "bridge" file containing the applicant data and SHAP values.
- `train_loan_model.py` — Python script for model training and SHAP calculation.
- `requirements.txt` — Python dependencies for the training script.
- `package.json` — React application dependencies and scripts.

---

## Data Attribution & License
This project uses the **Statlog (German Credit Data)** dataset from the UCI Machine
Learning Repository.
- **Citation:** Hofmann, Hans. (1994). *Statlog (German Credit Data)*. UCI Machine
  Learning Repository. https://doi.org/10.24432/C5NC77
- **License:** This dataset is licensed under a
  [Creative Commons Attribution 4.0 International (CC BY 4.0) license](https://creativecommons.org/licenses/by/4.0/).
