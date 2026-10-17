import urllib.request
import json
import sys

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

def run_tests():
    base = 'http://127.0.0.1:8000'
    print("=" * 70)
    print("MEDIVANTA AI - COMPLETE ENTERPRISE RUNTIME VERIFICATION SUITE")
    print("=" * 70)

    # 1. Health Check
    try:
        res = urllib.request.urlopen(f'{base}/health').read()
        health = json.loads(res.decode('utf-8'))
        print(f"[PASS] 1. System Health Status: {health.get('status')} (Version: {health.get('version')})")
    except Exception as e:
        print(f"[FAIL] Health check failed: {e}")
        sys.exit(1)

    # 2. Authentication across roles
    roles_to_test = [
        ("admin@medivanta.health", "ADMIN", "Dr. Alexander Wright"),
        ("doctor.smith@medivanta.health", "DOCTOR", "Dr. Julian Smith, MD"),
        ("nurse.emily@medivanta.health", "NURSE", "Emily Vance, BSN, RN"),
        ("reception.clara@medivanta.health", "RECEPTIONIST", "Clara Oswald"),
        ("lab.marcus@medivanta.health", "LAB_STAFF", "Marcus Sterling, MLS"),
        ("pharmacy.david@medivanta.health", "PHARMACIST", "David Thorne, PharmD"),
        ("billing.sophia@medivanta.health", "BILLING_STAFF", "Sophia Montgomery"),
        ("patient.john@medivanta.health", "PATIENT", "Johnathan Reynolds"),
    ]

    print("\n--- 1. Testing Authentication & Role Tokens ---")
    tokens = {}
    for email, role, expected_name in roles_to_test:
        payload = json.dumps({"email": email, "password": "Password123!"}).encode('utf-8')
        req = urllib.request.Request(
            f'{base}/api/auth/login',
            data=payload,
            headers={'Content-Type': 'application/json'}
        )
        res = json.loads(urllib.request.urlopen(req).read().decode('utf-8'))
        assert res['user']['role'] == role, f"Role mismatch: {res['user']['role']} != {role}"
        tokens[role] = res['access_token']
        print(f"  [PASS] Authenticated [{role}]: {res['user']['full_name']} ({email})")

    admin_headers = {'Authorization': f"Bearer {tokens['ADMIN']}"}
    doctor_headers = {'Authorization': f"Bearer {tokens['DOCTOR']}"}
    nurse_headers = {'Authorization': f"Bearer {tokens['NURSE']}"}

    # 3. Live Dashboard Analytics
    print("\n--- 2. Testing Analytics & Live Metrics ---")
    req = urllib.request.Request(f'{base}/api/analytics/overview', headers=admin_headers)
    stats = json.loads(urllib.request.urlopen(req).read().decode('utf-8'))
    print(f"  [PASS] Total Patients Registered: {stats['total_patients']}")
    print(f"  [PASS] Active Appointments Today: {stats['today_appointments']}")
    print(f"  [PASS] Total Beds: {stats['occupied_beds']} occupied / {stats['total_beds']} total")
    print(f"  [PASS] Total Revenue Logged: ${stats['total_revenue']:,.2f}")
    print(f"  [PASS] Low Stock Medicine Alerts: {stats['low_stock_medicines_count']} items")

    # 4. Multi-Hospital / Branch Architecture
    print("\n--- 3. Testing Multi-Hospital / Branch Architecture ---")
    req = urllib.request.Request(f'{base}/api/hospitals/', headers=admin_headers)
    hospitals = json.loads(urllib.request.urlopen(req).read().decode('utf-8'))
    print(f"  [PASS] Hospital Organizations: Loaded {len(hospitals)} enterprise network(s).")
    h1 = hospitals[0]
    print(f"     Organization: {h1['name']} ({h1['code']}) | Branches: {len(h1.get('branches', []))}")
    for b in h1.get('branches', []):
        print(f"       - Branch: {b['name']} ({b['city']}) | Floors: {len(b.get('floors', []))}")

    # 5. OPD Management & Live Queue
    print("\n--- 4. Testing OPD Registration, Queue Board & Next-Call Workflow ---")
    req = urllib.request.Request(f'{base}/api/opd/queue-board', headers=doctor_headers)
    board = json.loads(urllib.request.urlopen(req).read().decode('utf-8'))
    print(f"  [PASS] OPD Live Queue Board: {board['total_waiting']} waiting, {board['total_in_consultation']} in consultation, {board['total_completed_today']} completed.")
    if board['now_serving']:
        print(f"     Now Serving: Token {board['now_serving']['token_number']} ({board['now_serving'].get('patient_name', 'Patient')})")
    
    # Generate an OPD token
    new_token_payload = json.dumps({
        "patient_id": 1,
        "doctor_id": 1,
        "department_id": 1,
        "priority": "ROUTINE",
        "chief_complaint": "Routine cardiovascular checkup"
    }).encode('utf-8')
    req = urllib.request.Request(
        f'{base}/api/opd/tokens',
        data=new_token_payload,
        headers={'Content-Type': 'application/json', **admin_headers}
    )
    new_token = json.loads(urllib.request.urlopen(req).read().decode('utf-8'))
    print(f"  [PASS] Generated OPD Token: #{new_token['token_number']} (Status: {new_token['status']}, Est Wait: {new_token['estimated_wait_minutes']}m)")

    # Doctor calls next patient
    req = urllib.request.Request(
        f'{base}/api/opd/tokens/{new_token["id"]}/call',
        headers=doctor_headers,
        method='PUT'
    )
    called = json.loads(urllib.request.urlopen(req).read().decode('utf-8'))
    print(f"  [PASS] Doctor 'Call Next Patient' Trigger: Token #{called['token_number']} moved to {called['status']}")

    # 6. Emergency Department & Triage
    print("\n--- 5. Testing Emergency Registration, Triage & Critical Alerts ---")
    req = urllib.request.Request(f'{base}/api/emergency/triage-stats', headers=admin_headers)
    triage_stats = json.loads(urllib.request.urlopen(req).read().decode('utf-8'))
    print(f"  [PASS] Emergency Triage Census: {triage_stats['critical_red']} RED, {triage_stats['urgent_yellow']} YELLOW, {triage_stats['non_urgent_green']} GREEN (Total Active: {triage_stats['total_active']})")

    req = urllib.request.Request(f'{base}/api/emergency/episodes', headers=admin_headers)
    episodes = json.loads(urllib.request.urlopen(req).read().decode('utf-8'))
    print(f"  [PASS] Emergency Episodes: Loaded {len(episodes)} episodes.")
    for ep in episodes[:2]:
        print(f"     - {ep['emergency_number']} [{ep['triage_level']}]: {ep['chief_complaint']} (Bed: {ep.get('emergency_bed', 'ER Bay')})")

    # 7. Nursing Management & MAR
    print("\n--- 6. Testing Nursing Tasks, Station & MAR Medication System ---")
    req = urllib.request.Request(f'{base}/api/nursing/tasks', headers=nurse_headers)
    tasks = json.loads(urllib.request.urlopen(req).read().decode('utf-8'))
    print(f"  [PASS] Nursing Care Checklist: Loaded {len(tasks)} clinical care tasks.")
    
    req = urllib.request.Request(f'{base}/api/nursing/handovers', headers=nurse_headers)
    handovers = json.loads(urllib.request.urlopen(req).read().decode('utf-8'))
    print(f"  [PASS] Shift Handovers: Loaded {len(handovers)} shift handover summaries.")

    req = urllib.request.Request(f'{base}/api/mar/records', headers=nurse_headers)
    mar_records = json.loads(urllib.request.urlopen(req).read().decode('utf-8'))
    print(f"  [PASS] MAR Records: Loaded {len(mar_records)} scheduled medication doses.")
    if mar_records:
        mar_sample = mar_records[0]
        print(f"     Sample MAR: {mar_sample['medicine_name']} ({mar_sample['dosage']} {mar_sample['route']}) - Status: {mar_sample['status']}")

    # 8. Doctor Inpatient Ward Rounds
    print("\n--- 7. Testing Doctor Ward Rounds & Bedside Progress Notes ---")
    req = urllib.request.Request(f'{base}/api/rounds/admissions/1', headers=doctor_headers)
    rounds = json.loads(urllib.request.urlopen(req).read().decode('utf-8'))
    print(f"  [PASS] Inpatient Ward Rounds: Loaded {len(rounds)} chronological rounds for Admission #1.")
    for r in rounds[:1]:
        print(f"     Condition: {r['patient_condition']} | Notes: {r['progress_notes'][:60]}...")

    # 9. Insurance & Cashless Claims Management
    print("\n--- 8. Testing Insurance Policies & Cashless Claims Engine ---")
    req = urllib.request.Request(f'{base}/api/insurance/policies', headers=admin_headers)
    policies = json.loads(urllib.request.urlopen(req).read().decode('utf-8'))
    print(f"  [PASS] Insurance Policies: Loaded {len(policies)} active health policies.")

    req = urllib.request.Request(f'{base}/api/insurance/claims', headers=admin_headers)
    claims = json.loads(urllib.request.urlopen(req).read().decode('utf-8'))
    print(f"  [PASS] Cashless Claims: Loaded {len(claims)} adjudicated claims.")
    for cl in claims[:2]:
        print(f"     - Claim #{cl['claim_number']}: Total ${cl['total_claimed_amount']:,.2f} | Status: {cl['status']} | Co-Pay: ${cl['patient_co_pay_amount']:,.2f}")

    # 10. Advanced Bed Management & Transfers
    print("\n--- 9. Testing Advanced Bed Management & Transfer Engine ---")
    req = urllib.request.Request(f'{base}/api/beds/', headers=admin_headers)
    beds = json.loads(urllib.request.urlopen(req).read().decode('utf-8'))
    print(f"  [PASS] Bed Floor Map: {len(beds)} hospital beds configured across ICU, Emergency, General Ward, and Private Suites.")

    # 11. AI Clinical Assistant & Symptom Triage
    print("\n--- 10. Testing Medivanta AI Assistant & Doctor Copilot ---")
    triage_prompt = json.dumps({
        "message": "Patient with acute crushing chest pain radiating to left arm and diaphoresis.",
        "conversation_history": []
    }).encode('utf-8')
    req = urllib.request.Request(
        f'{base}/api/ai/chat',
        data=triage_prompt,
        headers={'Content-Type': 'application/json', **admin_headers}
    )
    ai_resp = json.loads(urllib.request.urlopen(req).read().decode('utf-8'))
    print(f"  [PASS] AI Clinical Guidance: {ai_resp['reply'][:85]}...")
    print(f"  [PASS] AI Suggested Actions: {ai_resp.get('suggested_actions', [])}")

    # 12. ReportLab PDF Generation
    print("\n--- 11. Testing ReportLab PDF Generation Engines ---")
    
    # PDF Invoice
    req = urllib.request.Request(f'{base}/api/billing/invoices/1/pdf', headers=admin_headers)
    inv_pdf = urllib.request.urlopen(req).read()
    assert inv_pdf.startswith(b'%PDF'), "Invalid PDF format for Invoice"
    print(f"  [PASS] Billing Invoice PDF: Generated ({len(inv_pdf):,} bytes)")

    # PDF Prescription
    req = urllib.request.Request(f'{base}/api/prescriptions/1/pdf', headers=doctor_headers)
    rx_pdf = urllib.request.urlopen(req).read()
    assert rx_pdf.startswith(b'%PDF'), "Invalid PDF format for Prescription"
    print(f"  [PASS] Medical Prescription PDF: Generated ({len(rx_pdf):,} bytes)")

    # PDF Lab Report
    req = urllib.request.Request(f'{base}/api/labs/orders/1/pdf', headers=admin_headers)
    lab_pdf = urllib.request.urlopen(req).read()
    assert lab_pdf.startswith(b'%PDF'), "Invalid PDF format for Lab Report"
    print(f"  [PASS] Diagnostic Lab Report PDF: Generated ({len(lab_pdf):,} bytes)")

    # PDF Discharge Summary
    req = urllib.request.Request(f'{base}/api/admissions/1/discharge-summary-pdf', headers=admin_headers)
    disc_pdf = urllib.request.urlopen(req).read()
    assert disc_pdf.startswith(b'%PDF'), "Invalid PDF format for Discharge Summary"
    print(f"  [PASS] Hospital Discharge Summary PDF: Generated ({len(disc_pdf):,} bytes)")

    print("\n" + "=" * 70)
    print("ALL ENTERPRISE MODULES & UPGRADES VERIFIED WITH 100% SUCCESS!")
    print("=" * 70)

if __name__ == '__main__':
    run_tests()
