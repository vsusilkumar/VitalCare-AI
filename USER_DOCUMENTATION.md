# VitalCare AI: User & Feature Documentation

## 1. Introduction

**VitalCare AI** is a modern, AI-powered health monitoring application designed to provide comprehensive care for patients, particularly the elderly. It serves as a central hub for patients, caregivers, and medical professionals to track vital signs, gain intelligent insights, and facilitate communication, ultimately enabling proactive and personalized healthcare.

The application is built using a robust frontend stack (React, TypeScript, TailwindCSS) and leverages the power of the **Google Gemini API** to deliver its advanced AI-driven features, transforming raw health data into actionable intelligence.

---

## 2. Core Features Overview

This document outlines the key functionalities of the VitalCare AI application, organized by its main sections: **Patient Dashboard**, **Caregiver Portal**, and **Video Consultation**.

### 2.1 Patient Dashboard

The Patient Dashboard is the primary interface for daily monitoring, offering a clear and immediate overview of the patient's health status.

**Key Functionalities:**

*   **At-a-Glance Vitals Monitoring:** Four interactive cards display the latest readings for Heart Rate, Blood Pressure, Temperature, and O₂ Saturation. The cards use trend icons for quick assessment and dynamically change style to indicate active selection. **Crucially, if a vital sign falls outside its normal range, the card will pulse with a red border, providing an immediate visual alert for critical conditions.**

*   **Interactive Historical Data Chart:** A detailed, zoomable, and pannable chart visualizes historical vital signs. Users can switch between different time ranges (24h, 7d, 30d) to identify long-term trends and patterns in the patient's health data.

*   **Multi-Modal Data Entry:** To ensure ease of use, the app supports three methods for inputting new vital readings:
    *   **Manual Entry:** A straightforward form for typing in values.
    *   **AI-Powered Voice Entry:** Utilizes the browser's speech recognition and the **Gemini API** to parse spoken vitals. Users can speak naturally (e.g., "Heart rate is 75, blood pressure 120 over 80"), and the AI intelligently extracts the values and populates the form for user confirmation.
    *   **NFC Scan:** Leverages Web NFC to capture vitals instantly from a compatible medical device or tag with a single tap.

*   **AI-Powered Health Insights:** With a single click, caregivers can trigger a sophisticated AI analysis of the patient's recent vitals. The **Gemini API** processes the last 24 hours of data in the context of the patient's specific medical history (e.g., Hypertension, Diabetes). It then provides a concise summary and actionable, non-diagnostic recommendations, turning complex data into easy-to-understand insights.

### 2.2 Family & Caregiver Portal

This secure portal is designed for family members and caregivers to manage patient care remotely and collaboratively. It is organized into three intuitive tabs: Overview, AI Smart Alerts, and Daily Log & Insights.

**Key Functionalities:**

*   **(Overview Tab) Care Management Tools:** This tab includes essential features for daily care, including adding and managing **Medication Reminders**, a **Direct Communication** chat interface for secure messaging with the medical team, and an **Emergency Contacts** list with a Quick Dial feature for immediate action.

*   **(AI Smart Alerts Tab) Intelligent Anomaly Detection:** This advanced feature goes beyond simple threshold alerts. It uses the **Gemini API** to analyze 7 days of historical data, establishing a patient-specific baseline. The AI then flags subtle but potentially significant patterns or deviations that would otherwise be missed, classifying them as an "Observation" or "Warning" and providing context for why it's noteworthy. This enables proactive care by identifying potential issues before they become critical.

*   **(Daily Log & Insights Tab) AI Lifestyle Correlation Analysis:** Caregivers can log the patient's daily meals and activities. The **Gemini API** can then be triggered to analyze this lifestyle data alongside vital signs from the same period. This powerful feature uncovers potential correlations—such as how a specific meal affects blood pressure or how light exercise impacts heart rate—providing a holistic view of the patient's health and helping caregivers understand the impact of daily choices.

### 2.3 Video Consultation

The Video Consultation screen simulates a live virtual visit between a doctor and the patient, enhanced with real-time data and AI-powered assistance for the medical professional.

**Key Functionalities:**

*   **Live Video Simulation:** Features a main video feed for the doctor and a draggable, resizable picture-in-picture view for the patient's camera, creating a realistic and flexible telehealth experience.

*   **Real-Time Vitals Sidebar:** During the call, the doctor has constant access to the patient's live vital signs, displayed in both card and chart format. Vital cards automatically pulse red if a reading is outside the normal range, drawing the doctor's immediate attention to potential issues during the consultation.

*   **AI Consultation Helper:** A powerful on-demand tool for the doctor. By clicking the **"Get AI Consultation Summary"** button, the **Gemini API** instantly analyzes the patient's latest vitals and medical history. It provides a concise, structured summary directly on the screen, highlighting key clinical observations and suggesting relevant questions to ask the patient. This feature acts as a real-time AI assistant, helping the doctor be more efficient and insightful during the limited time of a consultation.

---

## 3. Technical Highlights

*   **Component-Based Architecture:** Built with React, ensuring a scalable and maintainable codebase.
*   **Strongly-Typed:** Utilizes TypeScript to minimize runtime errors and improve developer experience.
*   **Responsive UI:** Styled with TailwindCSS for a modern, mobile-first design that works across all devices.
*   **Advanced AI Integration:** Deeply integrated with the **Google Gemini API**. The application makes extensive use of advanced features like **controlled JSON output via response schemas**. This ensures that the data received from the AI is always reliable, structured, and ready for seamless integration into the user interface, which is critical for features like Health Insights, Smart Alerts, and Voice Entry parsing.

---
