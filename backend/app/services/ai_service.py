import os
import httpx
from typing import List, Dict, Any, Optional
from app.core.config import settings

# Predefined medical knowledge & department guidance engine
DEPARTMENT_ROUTING = {
    "chest pain": ("Cardiology", "Immediate attention recommended if accompanied by shortness of breath."),
    "heart": ("Cardiology", "Cardiovascular health assessment & ECG review."),
    "headache": ("Neurology", "Evaluation for migraine, tension headache or neurological causes."),
    "migraine": ("Neurology", "Comprehensive neurological management."),
    "joint pain": ("Orthopedics", "Bone, joint and musculoskeletal examination."),
    "fracture": ("Orthopedics", "Emergency trauma & orthopedic stabilization."),
    "skin rash": ("Dermatology", "Skin barrier examination & dermatological care."),
    "acne": ("Dermatology", "Dermatology consultation and topical/systemic therapy."),
    "fever": ("General Medicine", "Infectious workup, CBC and fever management."),
    "cold": ("General Medicine", "Upper respiratory evaluation."),
    "stomach ache": ("Gastroenterology", "Abdominal examination, ultrasound or endoscopy."),
    "digestion": ("Gastroenterology", "Gastrointestinal tract assessment."),
    "vision": ("Ophthalmology", "Visual acuity, slit-lamp examination & eye health."),
    "child": ("Pediatrics", "Specialized pediatric consultation."),
    "pregnancy": ("Obstetrics & Gynecology", "Antenatal care and maternal wellness.")
}

MEDICATION_KNOWLEDGE = {
    "amoxicillin": "Broad-spectrum beta-lactam antibiotic used to treat bacterial infections. Must complete full course.",
    "paracetamol": "Analgesic and antipyretic used to reduce fever and mild-to-moderate pain.",
    "acetaminophen": "Analgesic and antipyretic used for pain relief and fever reduction.",
    "atorvastatin": "HMG-CoA reductase inhibitor (statin) used to lower LDL cholesterol and reduce cardiovascular risk.",
    "metformin": "Biguanide antihyperglycemic agent for Type 2 diabetes management.",
    "amlodipine": "Calcium channel blocker used to treat hypertension and chronic stable angina.",
    "omeprazole": "Proton pump inhibitor (PPI) that decreases stomach acid production for GERD and gastritis.",
    "azithromycin": "Macrolide antibiotic for respiratory tract infections and sinusitis.",
    "ibuprofen": "Non-steroidal anti-inflammatory drug (NSAID) for inflammation, swelling and pain."
}

CANDIDATE_MODELS = [
    "gemini-3.7-flash",
    "gemini-3.5-flash",
    "gemini-flash-lite-latest",
    "gemma-4-26b-a4b-it",
    "gemma-4-31b-it",
    "gemini-2.5-flash",
    "gemini-1.5-flash"
]

async def query_gemini_api(prompt: str, system_instruction: str = "") -> Optional[str]:
    """Query Google Gemini / Gemma models using configured GEMINI_API_KEY with automatic model fallback"""
    if not settings.GEMINI_API_KEY:
        return None
    
    payload: Dict[str, Any] = {
        "contents": [
            {
                "parts": [{"text": prompt}]
            }
        ]
    }
    if system_instruction:
        payload["systemInstruction"] = {
            "parts": [{"text": system_instruction}]
        }

    async with httpx.AsyncClient(timeout=12.0) as client:
        for model in CANDIDATE_MODELS:
            url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={settings.GEMINI_API_KEY}"
            try:
                response = await client.post(url, json=payload)
                if response.status_code == 200:
                    data = response.json()
                    candidates = data.get("candidates", [])
                    if candidates and "content" in candidates[0]:
                        parts = candidates[0]["content"].get("parts", [])
                        if parts and "text" in parts[0]:
                            return parts[0]["text"]
            except Exception as e:
                continue
    return None

async def generate_ai_chat_response(
    message: str, 
    history: List[Dict[str, str]] = [], 
    patient_context: Optional[Dict[str, Any]] = None
) -> Dict[str, Any]:
    query_lower = message.lower().strip()
    
    # Check for emergency keywords first for critical safety
    if any(k in query_lower for k in ["emergency", "heart attack", "can't breathe", "cannot breathe", "severe bleeding", "unconscious", "stroke"]):
        return {
            "reply": "⚠️ **URGENT MEDICAL NOTICE**: If you or someone with you is experiencing severe symptoms such as difficulty breathing, sudden chest pain radiating to arm/jaw, sudden weakness, or heavy bleeding, please go directly to the **Emergency Department (Level 1, Blue Wing)** or call emergency dispatch immediately (+1-800-555-8268).\n\nOur Emergency Triage team is available 24/7 with zero wait time.",
            "suggested_actions": ["Call Emergency (1-800-555-8268)", "Emergency Ward Location", "Consult On-Duty Physician"],
            "disclaimer": "Medivanta AI is an informational tool and cannot replace urgent emergency care."
        }

    # Query Google Gemini if configured
    if settings.GEMINI_API_KEY:
        system_prompt = (
            "You are Medivanta AI, the intelligent clinical concierge and hospital assistant at Medivanta Luxury Medical Institute. "
            "Provide helpful, accurate, empathetic medical information, department recommendations, and hospital service advice. "
            "Format responses using clear markdown with bullet points where appropriate. "
            "Always include a reminder to consult a medical professional for formal diagnoses."
        )
        gemini_reply = await query_gemini_api(message, system_prompt)
        if gemini_reply:
            return {
                "reply": gemini_reply,
                "suggested_actions": ["Book Appointment", "Find Doctors", "View Medical Records", "Pharmacy & Medications"],
                "disclaimer": "Medivanta AI is powered by Google Gemini and clinical intelligence engines. Always consult a physician for official clinical decisions."
            }
        
    # Check for department or symptom triage from local clinical rules
    matched_dept = None
    for kw, (dept, advice) in DEPARTMENT_ROUTING.items():
        if kw in query_lower:
            matched_dept = (dept, advice)
            break
            
    if matched_dept:
        dept_name, advice = matched_dept
        return {
            "reply": f"Based on your mention of related symptoms, we recommend consulting our **Department of {dept_name}**.\n\n"
                     f"**Clinical Insight:** {advice}\n\n"
                     f"Our {dept_name} team includes board-certified senior consultants with state-of-the-art diagnostic facilities at Medivanta. Would you like to view available doctors or book a consultation slot?",
            "suggested_actions": [f"Book {dept_name} Doctor", "View Available Slots", "Check Consultation Fees", "General Inquiries"],
            "disclaimer": "This suggestion is for guidance purposes only. A clinical examination by a physician is required for accurate diagnosis."
        }

    # Check for medication inquiries
    for med_name, med_info in MEDICATION_KNOWLEDGE.items():
        if med_name in query_lower:
            return {
                "reply": f"**Medication Information: {med_name.capitalize()}**\n\n"
                         f"{med_info}\n\n"
                         f"⚠️ **Key Safety Guidelines:**\n"
                         f"• Always follow the dosage and frequency prescribed by your physician.\n"
                         f"• Take with or without food as specified on your prescription.\n"
                         f"• Check your current active prescriptions in the Medivanta Patient Portal before taking new over-the-counter drugs.",
                "suggested_actions": ["View My Prescriptions", "Consult Pharmacist", "Refill Medicine"],
                "disclaimer": "Medication details are for educational reference only. Do not alter dosages without consulting your doctor."
            }

    # General hospital queries
    if "appointment" in query_lower or "book" in query_lower or "schedule" in query_lower:
        return {
            "reply": "You can seamlessly schedule an appointment with any of our specialist doctors through the **Appointments** portal. Select your preferred department, choose the doctor, pick a date and time slot, and confirm instantly. You will receive an SMS and in-app confirmation notification.",
            "suggested_actions": ["Book Appointment Now", "View Doctor Schedules", "My Appointments"],
            "disclaimer": "Medivanta AI Assistant"
        }
        
    if "lab" in query_lower or "test" in query_lower or "report" in query_lower:
        return {
            "reply": "Medivanta Diagnostic Laboratories offer automated hematology, biochemistry, pathology, and advanced imaging (MRI, CT, Ultrasound). Diagnostic test reports are digitally signed and available in your patient portal as downloadable PDFs within 12-24 hours.",
            "suggested_actions": ["View Lab Tests", "Download Lab Reports", "Book Home Sample Collection"],
            "disclaimer": "Medivanta AI Assistant"
        }

    if "bill" in query_lower or "payment" in query_lower or "cost" in query_lower or "insurance" in query_lower:
        return {
            "reply": "Medivanta provides transparent digital billing with itemized statements for consultations, pharmacy, diagnostic tests, and inpatient room stays. We support multiple payment gateways, cashless insurance claims, and flexible payment plans.",
            "suggested_actions": ["View Invoices", "Pay Outstanding Balance", "Insurance Desk"],
            "disclaimer": "Medivanta AI Assistant"
        }

    # Default friendly AI greeting & help
    return {
        "reply": "Welcome to **Medivanta AI Concierge**. I am your intelligent hospital care assistant powered by Google Gemini.\n\n"
                 "I can help you with:\n"
                 "• **Symptom guidance & Department matching** (e.g. 'I have persistent headaches')\n"
                 "• **Booking consultations & checking doctor availability**\n"
                 "• **Understanding lab investigations and prescriptions**\n"
                 "• **Hospital navigation, bed status, and billing inquiries**\n\n"
                 "How may I assist your healthcare journey today?",
        "suggested_actions": ["Book an Appointment", "Find Doctors", "View Medical Records", "Pharmacy & Medications"],
        "disclaimer": "Medivanta AI is designed for informational and administrative assistance. Always consult a physician for clinical decisions."
    }

def generate_doctor_ai_assist(
    action_type: str,
    patient_data: Dict[str, Any],
    raw_notes: Optional[str] = None
) -> Dict[str, Any]:
    name = patient_data.get("full_name", "Patient")
    mrn = patient_data.get("mrn", "MRN")
    allergies = patient_data.get("allergies", "None reported")
    conditions = patient_data.get("chronic_conditions", "None documented")
    
    if action_type == "draft_soap_note":
        notes_text = raw_notes or "Patient presented with 3-day history of productive cough, mild fever (99.8 F), fatigue. Chest clear on auscultation. BP 120/80, SpO2 98%."
        soap_text = (
            f"**CLINICAL SOAP NOTE (AI-DRAFTED - REQUIRES MD APPROVAL)**\n\n"
            f"**Patient:** {name} (MRN: {mrn})\n\n"
            f"**S (Subjective):**\n"
            f"• Chief Complaints: {notes_text}\n"
            f"• Allergies: {allergies}\n"
            f"• Chronic History: {conditions}\n\n"
            f"**O (Objective):**\n"
            f"• Physical Examination: Systemic evaluation performed. Alert, oriented, hemodynamically stable.\n"
            f"• Vitals: Normotensive, normal oxygenation.\n\n"
            f"**A (Assessment):**\n"
            f"• Primary Impression: Acute Upper Respiratory Tract Infection (viral etiology favored).\n"
            f"• Differential: Allergic bronchitis, early bacterial superinfection.\n\n"
            f"**P (Plan):**\n"
            f"1. Symptomatic relief with antipyretics and hydration.\n"
            f"2. Order CBC with Differential if fever persists > 48h.\n"
            f"3. Red flag instructions provided (dyspnea, hemoptysis).\n"
            f"4. Follow-up in 5-7 days or PRN."
        )
        return {
            "generated_text": soap_text,
            "key_findings": ["Normotensive vitals", "Clear respiratory status", "Low risk profile"],
            "recommended_precautions": ["Check for antibiotic overprescribing", "Confirm allergy history"],
            "is_ai_draft": True
        }

    elif action_type == "draft_discharge_summary":
        summary_text = (
            f"**HOSPITAL INPATIENT DISCHARGE SUMMARY (AI-DRAFTED)**\n\n"
            f"**Patient:** {name} | **MRN:** {mrn}\n"
            f"**Allergies:** {allergies}\n\n"
            f"**Course in Hospital:**\n"
            f"Patient was admitted for therapeutic management and close monitoring. Vital signs stabilized within normal limits. Completed intravenous regimen with good tolerance. Ambulatory without distress.\n\n"
            f"**Discharge Condition:** Stable, Afebrile, Alert.\n\n"
            f"**Discharge Advice & Follow-up:**\n"
            f"1. Continue prescribed oral medications as indicated in the discharge prescription.\n"
            f"2. Maintain adequate fluid intake and avoid strenuous exertion for 7 days.\n"
            f"3. Outpatient clinic follow-up scheduled in 10 days."
        )
        return {
            "generated_text": summary_text,
            "key_findings": ["Completed planned inpatient therapy", "Discharge vitals within normal parameters"],
            "recommended_precautions": ["Ensure post-discharge medication reconciliation", "Follow-up alert scheduled"],
            "is_ai_draft": True
        }

    elif action_type == "differential_diagnosis":
        diff_text = (
            f"**AI DIFFERENTIAL DIAGNOSIS SUGGESTIONS**\n\n"
            f"**Patient Presentation:** {raw_notes or 'Generalized symptoms'}\n\n"
            f"1. **Primary Working Diagnosis (Probability: ~70%):**\n"
            f"   - Acute viral syndrome / Upper respiratory infection.\n\n"
            f"2. **Secondary Consideration (Probability: ~20%):**\n"
            f"   - Early bacterial respiratory infection / acute sinusitis.\n\n"
            f"3. **Rule Out / Red Flags (Probability: <10%):**\n"
            f"   - Atypical pneumonia, acute bronchitis.\n\n"
            f"**Recommended Investigations:** CBC with Diff, Chest X-ray (PA view) if dyspneic, CRP."
        )
        return {
            "generated_text": diff_text,
            "key_findings": ["Multifactorial symptom evaluation", "Diagnostic workup suggested"],
            "recommended_precautions": ["Re-evaluate if symptoms progress or oxygenation drops"],
            "is_ai_draft": True
        }

    return {
        "generated_text": f"AI Clinical Copilot ready for patient {name} (MRN: {mrn}).",
        "key_findings": [],
        "recommended_precautions": [],
        "is_ai_draft": True
    }
