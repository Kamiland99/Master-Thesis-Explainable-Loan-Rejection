# Loan Rejection Experiment - Local Setup

This project is a React-based web application for exploring explainable AI in loan rejection scenarios. It is part of a Master Thesis project at Universität Wien (University of Vienna) and also includes a Python script for retraining the underlying machine learning model and generating new applicant data.

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

If you want to retrain the model or adjust the applicant cases, use the provided `train_loan_model.py` script.

### Prerequisites
- [Python 3.8+](https://www.python.org/)
- `pip` (Python package manager)

### Installation
1. Install the required Python libraries:
   ```bash
   pip install -r requirements.txt
   ```

### Retraining
1. `german.data` file (from the UCI German Credit Database) is stored in the root directory.
2. Run the training script:
   ```bash
   python train_loan_model.py
   ```
3. The script will automatically generate and update the `new_applicants.json` root file.
4. The React application automatically imports this JSON file in `src/data.ts` without requirement for manual intervention. The setup processes all 1,000 cases to dynamically identify the 3 best borderline applicants for the experiment.

## 3. The Experiment Design

This application is designed as a **Master Thesis Project** to evaluate different methods of Explainable AI (XAI).

### Experimental Conditions:
- **Condition A (Static Analysis):** Users are presented with a visual SHAP (SHapley Additive exPlanations) plot. This shows the mathematical contribution of each feature to the final risk score using color-coded bars (Red for increasing risk, Blue for decreasing risk).
- **Condition B (Conversational Analysis):** Users interact with an AI Assistant (powered by Google Gemini). The assistant uses "Progressive Disclosure" to explain the decision step-by-step, allowing the user to ask follow-up questions.

### Data Source:
The experiment uses the **German Credit Database** (UCI Machine Learning Repository), which contains 1,000 instances of credit applications classified as "Good" or "Bad" risk based on 20 attributes.

### Key Features:
- **Researcher Mode (Data Explorer):** A dedicated interface to browse all applicants and their SHAP plots. Use this to review the model's output after retraining and select the most interesting cases for your study.
- **Randomization:** Applicants are shuffled for each participant to ensure unbiased results.
- **Progress Tracking:** A progress bar shows the participant's position in the experiment.
- **Data Export:** For Condition B, the application generates a PDF of the chat history at the end of the session for qualitative analysis.

---

## Project Structure

- `src/`: React source code.
- `src/data.ts`: The "bridge" file containing the applicant data and SHAP values.
- `train_loan_model.py`: Python script for model training and SHAP calculation.
- `requirements.txt`: Python dependencies for the training script.
- `package.json`: React application dependencies and scripts.

## Data Attribution & License

This project utilises the **Statlog (German Credit Data)** dataset from the UCI Machine Learning Repository. 

- **Citation:** Hofmann, Hans. (1994). Statlog (German Credit Data). UCI Machine Learning Repository. https://doi.org/10.24432/C5NC77.
- **License:** This dataset is licensed under a [Creative Commons Attribution 4.0 International (CC BY 4.0) license](https://creativecommons.org/licenses/by/4.0/).
