# Loan Rejection Experiment: Technical Architecture & Overview

---

## 1. High-Level Architecture
The project is a React-based web application deployed to evaluate Explainable AI (XAI) within loan rejection scenarios. It aims to test two user interfaces (Static SHAP visualizations vs. Conversational AI) using real-world data to evaluate user understanding and trust.

**Tech Stack:**
*   **Frontend:** React 18, TypeScript, Tailwind CSS, Vite, Framer Motion (for UI animations) & Lucide React (for iconography).
*   **Machine Learning (Backend Prep):** Python, Pandas, Random Forest, SHAP.
*   **AI Integration:** Google Gemini API (`@google/genai` client).
*   **Data Export:** `jspdf` for qualitative log extraction.

---

## 2. Machine Learning Model & Data Pipeline

### a. German Credit Database
The foundation of the experiment is the **UCI German Credit Database**. It contains 1,000 credit applications, describing individuals using 20 distinct attributes (e.g., checking account status, credit history, purpose, age) classified into good (0) and bad (1) credit risks. 

### b. Random Forest Training
The model relies on a **Random Forest Classifier** (`RandomForestClassifier` from Scikit-Learn) deployed via a standalone Python pipeline ([train_loan_model.py](file:///c:/Users/kamil/Downloads/loan-rejection-experiment/train_loan_model.py)). 
**Crucial ML Design Choices:**
1.  **Proper Train/Test Split:** The model strictly trains on an 80% subset while reserving 20% for accuracy testing to prevent data leakage.
2.  **Explicit Ordinal Encoding:** Categorical attributes are ordinally mapped explicitly (e.g. `checking_account`: 'A11' -> 0, 'A12' -> 1, 'A13' -> 2, 'A14' -> 3) to preserve semantic hierarchy in the Random Forest trees.
3.  **Class-1 SHAP Extraction:** SHAP value extraction specifically targets class 1 (bad credit risk) to ensure features pushing towards "rejection" have positive values.
4.  **Batch Probability Predictions:** The pipeline utilizes batch `predict_proba` for efficient and consistent probability mapping alongside SHAP extraction.

### c. SHAP Generation & JSON Export
Using `shap.TreeExplainer`, the script calculates precise Shapley Additive exPlanations (SHAP) for every applicant instance. The SHAP values directly align with human intuition: risky traits output *positive* SHAP values pushing towards rejection, while safe traits output *negative* SHAP values pushing towards approval.
The Python script exports this data into a standardized [new_applicants.json](file:///c:/Users/kamil/Downloads/loan-rejection-experiment/new_applicants.json) payload containing:
*   Applicant IDs
*   Calculated risk probability (0.0 to 1.0)
*   Top features array containing readable human string values and exact float SHAP impacts.

---

## 3. Experimental Conditions

The application randomizes participants through three "borderline" rejected loan applications, which are dynamically selected as the closest rejected cases to a 50% risk score), serving them in one of two predefined UX structural conditions.

### Condition A: Static Analysis (SHAP Visualizations)
Participants review cases entirely through a static visual interface using a custom rendered horizontal **SHAP Plot**. 
*   **Visual Encoding:** The [ShapPlot.tsx](file:///c:/Users/kamil/Downloads/loan-rejection-experiment/src/components/ShapPlot.tsx) component interprets the JSON SHAP data. Red bars extending to the right symbolize features pushing the risk *higher* (towards rejection), while blue bars extending to the left show features pushing risk *lower*. 
*   **Progressive UI:** It only shows the top 12 most computationally influential features initially to reduce cognitive load, requiring the user to "expand" to see the full list of 20 variables.

### Condition B: Conversational Analysis (Google Gemini LLM)
Participants arrive at a chat interface ([ChatWindow.tsx](file:///c:/Users/kamil/Downloads/loan-rejection-experiment/src/components/ChatWindow.tsx)) where an AI assistant acts as a Credit Risk Analyst. Instead of seeing a chart, users must actively request information to deduce the rejection reasons.
*   **Prompt Engineering Structure:** A highly restrictive System Prompt is injected at the start of every session ([App.tsx](file:///c:/Users/kamil/Downloads/loan-rejection-experiment/src/App.tsx)). The prompt forces **"Progressive Disclosure."** It explicitly dictates the LLM must *never* list all 20 factors unprompted. If asked why a loan was rejected, it is commanded to only analyze the high-level logic and initially reveal only the *two most influential features* (based strictly on highest positive SHAP values embedded in the JSON structure). 
*   **Strict Grounding:** The LLM is confined heavily to only the JSON payload injected contextually behind the scenes. It refuses to answer queries for financial features that don't exist in the data list, preventing hallucination. All outputs are capped at a maximum of 100 words.
*   **User Interactions:** The UI surfaces context-aware "Quick Prompts" (e.g., "Tell me about this loan application", "What are the relevant factors in this loan application?") to break the "blank canvas" paralysis for participants.

---

## 4. Data Storage and Session Persistence
*   **Client State:** All applicant logic, randomized ordering, and state routing are maintained entirely in React states inside [App.tsx](file:///c:/Users/kamil/Downloads/loan-rejection-experiment/src/App.tsx).
*   **Chat Logging:** In Condition B, the dialogue arrays are maintained locally in a `chatHistories` object. 
*   **PDF Export Engine:** Because qualitative analysis drives the experiment, upon clicking "Finish Experiment" in Condition B, the client-side `jsPDF` engine compiles the entire multi-applicant AI chat history into a downloadable `loan-experiment-chat-history.pdf` document. This allows the supervisor/researcher to safely parse participant intent and dialogue pathways without a backend database requirement.

---

## 5. Researcher "Data Explorer" Mode
Built deeply into the app is a researcher triage dashboard. Accessible from the Welcome screen, "Data Explorer Mode" visually parses 1000 potential applicants from the JSON export. This is used exclusively by the researcher to investigate the SHAP visual bounds and hand-select the most "borderline" or interpretively-interesting applications for the participants to evaluate in the primary study arrays (which algorithmically pulls the 3 most borderline rejected applications closest to a 50% probability).
