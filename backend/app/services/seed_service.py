from datetime import datetime, date, timedelta
import random
from sqlalchemy.orm import Session
from app.models.models import (
    User, UserRole, Department, Doctor, Patient, Appointment, 
    AppointmentStatus, PriorityLevel, MedicalRecord, Medicine, 
    Prescription, PrescriptionItem, PrescriptionStatus,
    LabTest, LabOrder, LabOrderItem, LabStatus, LabFlag,
    Bed, BedType, BedStatus, Admission, AdmissionStatus,
    Invoice, InvoiceItem, InvoiceStatus, ItemType, Payment, PaymentMethod,
    Notification, AuditLog,
    Hospital, Branch, Floor, Ward, Room,
    OpdQueueToken, OpdTokenStatus,
    EmergencyEpisode, EmergencyStatus, EmergencyTriageLevel, EmergencyArrivalMethod,
    NursingTask, NursingTaskStatus, NursingTaskCategory, NursingNote, ShiftHandover,
    MedicationAdministration, MarStatus, MarRoute,
    DoctorRound, BedTransfer,
    InsurancePolicy, InsuranceClaim, InsuranceClaimStatus, PreAuthStatus
)
from app.core.security import get_password_hash

def seed_database(db: Session):
    # Check if database is already seeded
    if db.query(User).filter(User.email == "admin@medivanta.health").first():
        print("Database already seeded.")
        return

    print("Seeding Medivanta AI Enterprise Hospital database...")
    default_password = get_password_hash("Password123!")

    # 0. Create Hospital Hierarchy
    hosp = Hospital(
        name="Medivanta Luxury Medical Institute & Research Centre",
        code="MED-MAIN",
        address="108 Healthway Boulevard, Medical City, MC 94016",
        city="Metropolis",
        state="CA",
        phone="+1 (800) 555-MEDI",
        email="concierge@medivanta.health",
        website="https://medivanta.health",
        license_number="HOSP-2026-MED-098",
        tax_id="TX-8839210",
        is_active=True,
        settings={"currency": "USD", "timezone": "America/Los_Angeles", "opd_token_prefix": "MED"}
    )
    db.add(hosp)
    db.flush()

    branch1 = Branch(
        hospital_id=hosp.id,
        name="Medivanta Central Pavilion & Trauma Centre",
        code="MED-CP",
        address="108 Healthway Boulevard, Building A, Metropolis, CA",
        phone="+1 (800) 555-0101",
        email="central@medivanta.health",
        is_main_branch=True,
        is_active=True
    )
    branch2 = Branch(
        hospital_id=hosp.id,
        name="Medivanta South Specialty & Oncology Wing",
        code="MED-SS",
        address="442 Oceanview Parkway, South Bay, CA",
        phone="+1 (800) 555-0102",
        email="south@medivanta.health",
        is_main_branch=False,
        is_active=True
    )
    db.add(branch1)
    db.add(branch2)
    db.flush()

    # Floors, Wards & Rooms
    floors = []
    for f_num, f_name in [(1, "Ground Floor - Emergency & OPD"), (2, "2nd Floor - Surgical & Cardiology"), (3, "3rd Floor - Intensive Care & Recovery"), (4, "4th Floor - Executive VIP Suites")]:
        fl = Floor(branch_id=branch1.id, floor_number=f_num, name=f_name)
        db.add(fl)
        floors.append(fl)
    db.flush()

    ward_icu = Ward(branch_id=branch1.id, floor_id=floors[2].id, name="Cardiovascular ICU", code="W-CICU", ward_type=BedType.ICU, total_beds=16)
    ward_emg = Ward(branch_id=branch1.id, floor_id=floors[0].id, name="Level-1 Emergency Trauma Bay", code="W-EMG", ward_type=BedType.EMERGENCY, total_beds=16)
    ward_gen = Ward(branch_id=branch1.id, floor_id=floors[1].id, name="General Medical Ward", code="W-GEN", ward_type=BedType.GENERAL_WARD, total_beds=20)
    ward_vip = Ward(branch_id=branch1.id, floor_id=floors[3].id, name="Presidential VIP Suites", code="W-VIP", ward_type=BedType.PRIVATE_ROOM, total_beds=12)
    db.add_all([ward_icu, ward_emg, ward_gen, ward_vip])
    db.flush()

    # Rooms
    rooms = []
    for w, prefix, cap, rate in [(ward_icu, "ICU", 1, 850.0), (ward_emg, "EMG", 2, 450.0), (ward_gen, "GEN", 4, 180.0), (ward_vip, "VIP", 1, 950.0)]:
        for r_idx in range(1, 5):
            rm = Room(ward_id=w.id, room_number=f"{prefix}-{r_idx:02d}", room_type=f"{w.name} Room", max_capacity=cap, daily_rate=rate)
            db.add(rm)
            rooms.append(rm)
    db.flush()

    # 1. Create Core Staff & Demo Users
    users_data = [
        ("admin@medivanta.health", "Dr. Alexander Wright", UserRole.ADMIN, "+1 (555) 019-2831", "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&h=200&fit=crop&crop=faces"),
        ("doctor.smith@medivanta.health", "Dr. Julian Smith, MD", UserRole.DOCTOR, "+1 (555) 014-9921", "https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=200&h=200&fit=crop&crop=faces"),
        ("doctor.chen@medivanta.health", "Dr. Linnea Chen, MD, PhD", UserRole.DOCTOR, "+1 (555) 018-4422", "https://images.unsplash.com/photo-1594824813580-5a3d026330ce?w=200&h=200&fit=crop&crop=faces"),
        ("doctor.patel@medivanta.health", "Dr. Rajesh Patel, MS", UserRole.DOCTOR, "+1 (555) 013-8833", "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=200&h=200&fit=crop&crop=faces"),
        ("doctor.sarah@medivanta.health", "Dr. Sarah Jenkins, FAAP", UserRole.DOCTOR, "+1 (555) 012-7711", "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=200&h=200&fit=crop&crop=faces"),
        ("nurse.emily@medivanta.health", "Emily Vance, BSN, RN", UserRole.NURSE, "+1 (555) 017-3319", "https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?w=200&h=200&fit=crop&crop=faces"),
        ("reception.clara@medivanta.health", "Clara Oswald", UserRole.RECEPTIONIST, "+1 (555) 016-1188", "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200&h=200&fit=crop&crop=faces"),
        ("lab.marcus@medivanta.health", "Marcus Sterling, MLS", UserRole.LAB_STAFF, "+1 (555) 015-6677", "https://images.unsplash.com/photo-1537368910025-700350fe46c7?w=200&h=200&fit=crop&crop=faces"),
        ("pharmacy.david@medivanta.health", "David Thorne, PharmD", UserRole.PHARMACIST, "+1 (555) 011-5544", "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&crop=faces"),
        ("billing.sophia@medivanta.health", "Sophia Montgomery", UserRole.BILLING_STAFF, "+1 (555) 019-9900", "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=200&h=200&fit=crop&crop=faces"),
        ("patient.john@medivanta.health", "Johnathan Reynolds", UserRole.PATIENT, "+1 (555) 010-8811", "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop&crop=faces"),
        ("patient.elena@medivanta.health", "Elena Rostova", UserRole.PATIENT, "+1 (555) 010-9922", "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&h=200&fit=crop&crop=faces")
    ]

    created_users = {}
    for email, name, role, phone, avatar in users_data:
        u = User(
            email=email,
            hashed_password=default_password,
            full_name=name,
            role=role,
            phone=phone,
            avatar_url=avatar,
            hospital_id=hosp.id,
            branch_id=branch1.id,
            is_active=True,
            is_verified=True,
            created_at=datetime.utcnow() - timedelta(days=90)
        )
        db.add(u)
        created_users[email] = u
    db.commit()

    # 2. Create Departments
    depts_data = [
        ("Cardiology", "CARD", "Advanced Cardiovascular Surgery & Interventional Cardiology", "HeartPulse"),
        ("Neurology", "NEUR", "Comprehensive Brain, Spine, and Neurovascular Institute", "Brain"),
        ("Orthopedics", "ORTH", "Joint Replacement, Spine Care & Sports Medicine", "Activity"),
        ("Pediatrics", "PEDI", "Neonatal & Comprehensive Child Healthcare", "Baby"),
        ("Oncology", "ONCO", "Targeted Chemotherapy, Radiation & Immuno-oncology", "ShieldAlert"),
        ("General Medicine", "GMED", "Internal Medicine & Chronic Disease Management", "Stethoscope")
    ]
    created_depts = {}
    for name, code, desc, icon in depts_data:
        dept = Department(name=name, code=code, description=desc, icon=icon, hospital_id=hosp.id)
        db.add(dept)
        created_depts[code] = dept
    db.commit()

    # 3. Create Doctors
    doctors_info = [
        ("doctor.smith@medivanta.health", "CARD", "Chief of Interventional Cardiology", "MD, FACC, FSCAI (Johns Hopkins)", 16, 250.0, "Room 301, Cardiovascular Wing"),
        ("doctor.chen@medivanta.health", "NEUR", "Director of Cerebrovascular Neurosurgery", "MD, PhD, FAANS (Harvard Medical)", 14, 280.0, "Room 408, Neuroscience Center"),
        ("doctor.patel@medivanta.health", "ORTH", "Senior Orthopedic & Robotic Spine Surgeon", "MS (Ortho), MCh, FRCS (Oxford)", 18, 220.0, "Room 214, Ortho Pavilion"),
        ("doctor.sarah@medivanta.health", "PEDI", "Consultant Pediatric Cardiologist", "MD, FAAP, DCH (Stanford Medicine)", 11, 190.0, "Room 105, Children's Wing")
    ]
    created_doctors = []
    for email, dept_code, spec, qual, exp, fee, room in doctors_info:
        doc = Doctor(
            user_id=created_users[email].id,
            department_id=created_depts[dept_code].id,
            branch_id=branch1.id,
            specialization=spec,
            qualification=qual,
            experience_years=exp,
            consultation_fee=fee,
            room_number=room,
            available_days="Mon,Tue,Wed,Thu,Fri,Sat",
            start_time="08:30",
            end_time="17:30",
            rating=round(random.uniform(4.8, 5.0), 1)
        )
        db.add(doc)
        created_doctors.append(doc)
    db.commit()

    # 4. Create Patients
    patients_data = [
        ("Johnathan Reynolds", date(1982, 4, 15), "Male", "O+", "+1 (555) 010-8811", "patient.john@medivanta.health", "742 Evergreen Terrace, Metropolis", "Penicillin", "Hypertension", "Blue Cross Blue Shield", "BCBS-9948210"),
        ("Elena Rostova", date(1990, 8, 22), "Female", "A+", "+1 (555) 010-9922", "patient.elena@medivanta.health", "1204 Pine Crest Way, Metropolis", "Sulfa drugs", "None", "United Healthcare", "UHC-7741098"),
        ("Marcus Brody", date(1975, 11, 3), "Male", "B+", "+1 (555) 010-3344", "marcus.brody@example.com", "88 Kingfisher Court, Bay Area", "None", "Type 2 Diabetes", "Aetna Health", "AET-5501923"),
        ("Sophia Lorenson", date(1968, 2, 19), "Female", "AB+", "+1 (555) 010-5566", "sophia.l@example.com", "309 Beacon Street, Metropolis", "NSAIDs, Aspirin", "Osteoarthritis", "Cigna Global", "CIG-3319082"),
        ("Daniel Kim", date(1995, 6, 30), "Male", "O-", "+1 (555) 010-7788", "daniel.kim@example.com", "512 Silicon Way, Tech Park", "Peanuts, Latex", "Asthma", "Kaiser Permanente", "KP-8820194"),
        ("Victoria Sterling", date(1988, 12, 10), "Female", "A-", "+1 (555) 010-9900", "v.sterling@example.com", "18 Kensington Gardens, Metropolis", "None", "None", "Anthem Blue Cross", "ANT-1109483"),
        ("Robert MacIntyre", date(1959, 9, 5), "Male", "B-", "+1 (555) 010-1122", "robert.mac@example.com", "401 Highland Avenue, North Hills", "Codeine", "Coronary Artery Disease", "Medicare Gold", "MED-6602931"),
        ("Amara Okafor", date(1993, 1, 25), "Female", "O+", "+1 (555) 010-2233", "amara.o@example.com", "92 Horizon Drive, Metropolis", "None", "Migraines", "Humana Premier", "HUM-4491028"),
        ("Lucas Vance", date(2001, 7, 14), "Male", "A+", "+1 (555) 010-4455", "lucas.v@example.com", "610 University Boulevard, Metropolis", "None", "None", "Student Health Shield", "SHS-9920191"),
        ("Catherine Dupont", date(1978, 5, 18), "Female", "AB-", "+1 (555) 010-6677", "catherine.d@example.com", "233 Promenade Lane, Metropolis", "Iodine contrast", "Hyperthyroidism", "Blue Shield Platinum", "BSP-2281903")
    ]

    for i in range(11, 21):
        patients_data.append((
            f"Patient Demo {i}", date(1970 + i, (i % 12) + 1, (i * 2) % 28 + 1),
            "Male" if i % 2 == 0 else "Female",
            random.choice(["A+", "B+", "O+", "AB+", "O-"]),
            f"+1 (555) 019-{1000+i}",
            f"patient.{i}@medivanta.demo",
            f"{100*i} Medical Way, Metropolis",
            "None reported", "None", "Blue Cross", f"BCBS-88{i:04d}"
        ))

    created_patients = []
    for idx, p_info in enumerate(patients_data):
        user_id = created_users["patient.john@medivanta.health"].id if idx == 0 else (
            created_users["patient.elena@medivanta.health"].id if idx == 1 else None
        )
        p = Patient(
            user_id=user_id,
            hospital_id=hosp.id,
            branch_id=branch1.id,
            mrn=f"MED-2026-{idx+1:04d}",
            full_name=p_info[0],
            date_of_birth=p_info[1],
            gender=p_info[2],
            blood_group=p_info[3],
            phone=p_info[4],
            email=p_info[5],
            address=p_info[6],
            allergies=p_info[7],
            chronic_conditions=p_info[8],
            insurance_provider=p_info[9],
            insurance_policy_number=p_info[10]
        )
        db.add(p)
        created_patients.append(p)
    db.commit()

    # 5. Create Beds
    created_beds = []
    bed_types_pool = [
        (BedType.ICU, 3, 850.0, "ICU", ward_icu.id),
        (BedType.EMERGENCY, 1, 450.0, "EMG", ward_emg.id),
        (BedType.GENERAL_WARD, 2, 180.0, "GW", ward_gen.id),
        (BedType.PRIVATE_ROOM, 4, 650.0, "VIP", ward_vip.id)
    ]

    bed_count = 1
    for b_type, floor_num, rate, prefix, ward_id in bed_types_pool:
        for b_idx in range(1, 17):
            b_status = BedStatus.AVAILABLE
            if b_idx <= 2:
                b_status = BedStatus.OCCUPIED
            elif b_idx == 3:
                b_status = BedStatus.CLEANING
            elif b_idx == 4:
                b_status = BedStatus.ISOLATION

            b = Bed(
                bed_number=f"{prefix}-{b_idx:03d}",
                ward_type=b_type,
                floor=floor_num,
                room_number=f"Room {floor_num}0{(b_idx-1)//4 + 1}",
                daily_rate=rate,
                status=b_status,
                ward_id=ward_id,
                branch_id=branch1.id
            )
            db.add(b)
            created_beds.append(b)
            bed_count += 1
    db.commit()

    # 6. Create Medicines
    meds_data = [
        ("Atorvastatin 20mg", "Atorvastatin Calcium", "Cardiovascular", "BAT-2026-001", 1.85, 450, 50, date(2027, 1, 10)),
        ("Amlodipine 5mg", "Amlodipine Besylate", "Antihypertensive", "BAT-2026-002", 0.95, 380, 40, date(2026, 12, 15)),
        ("Metformin 500mg", "Metformin Hydrochloride", "Antidiabetic", "BAT-2026-003", 0.65, 520, 60, date(2027, 3, 20)),
        ("Amoxicillin 500mg", "Amoxicillin Trihydrate", "Antibiotics", "BAT-2026-004", 2.20, 18, 30, date(2026, 8, 20)), # Low stock
        ("Azithromycin 250mg", "Azithromycin Dihydrate", "Antibiotics", "BAT-2026-005", 3.40, 120, 25, date(2026, 11, 30)),
        ("Paracetamol 650mg", "Acetaminophen", "Analgesic", "BAT-2026-006", 0.35, 1200, 100, date(2027, 6, 15)),
        ("Pantoprazole 40mg", "Pantoprazole Sodium", "Gastrointestinal", "BAT-2026-007", 1.15, 340, 40, date(2027, 2, 28)),
        ("Clopidogrel 75mg", "Clopidogrel Bisulfate", "Antiplatelet", "BAT-2026-008", 2.75, 210, 30, date(2026, 10, 14)),
        ("Rosuvastatin 10mg", "Rosuvastatin Calcium", "Cardiovascular", "BAT-2026-009", 2.10, 15, 30, date(2026, 9, 10)), # Low stock
        ("Levothyroxine 50mcg", "Levothyroxine Sodium", "Endocrine", "BAT-2026-010", 0.80, 290, 35, date(2027, 5, 22)),
        ("Ceftriaxone 1g Inj", "Ceftriaxone Sodium", "Injectable Antibiotic", "BAT-2026-011", 14.50, 85, 20, date(2026, 11, 10)),
        ("Enoxaparin 40mg Inj", "Low Molecular Weight Heparin", "Anticoagulant", "BAT-2026-012", 22.00, 60, 15, date(2026, 12, 1)),
        ("Furosemide 40mg", "Furosemide", "Diuretic", "BAT-2026-013", 0.50, 310, 30, date(2027, 4, 15)),
        ("Ondansetron 4mg", "Ondansetron Hydrochloride", "Antiemetic", "BAT-2026-014", 1.25, 190, 25, date(2027, 1, 18)),
        ("Tramadol 50mg", "Tramadol Hydrochloride", "Analgesic (Opioid)", "BAT-2026-015", 3.10, 95, 20, date(2026, 10, 25))
    ]
    created_medicines = []
    for idx, (m_name, g_name, cat, batch, price, stock, reorder, exp) in enumerate(meds_data):
        med = Medicine(
            code=f"MED-PHARM-{idx+1:04d}",
            name=m_name,
            generic_name=g_name,
            category=cat,
            batch_number=batch,
            unit_price=price,
            stock_quantity=stock,
            reorder_level=reorder,
            expiry_date=exp,
            manufacturer="Medivanta Pharma Laboratories",
            manufacturing_date=date.today() - timedelta(days=180),
            location_rack=f"Rack {chr(65 + idx%6)}-0{idx//6 + 1}"
        )
        db.add(med)
        created_medicines.append(med)
    db.commit()

    # 7. Create Diagnostic Lab Tests
    lab_tests_data = [
        ("Complete Blood Count (CBC)", "Hematology", "Blood", 45.0, "WBC: 4.5-11.0, RBC: 4.2-5.9, Hb: 13.5-17.5", "10^3/uL", 6),
        ("Comprehensive Lipid Profile", "Biochemistry", "Blood", 65.0, "Chol: <200, Trig: <150, HDL: >40, LDL: <100", "mg/dL", 8),
        ("HbA1c Glycated Hemoglobin", "Biochemistry", "Blood", 55.0, "Normal: <5.7%, Pre-diabetic: 5.7-6.4%", "%", 6),
        ("Renal Function Test (BUN/Cr)", "Biochemistry", "Blood", 70.0, "BUN: 7-20, Creatinine: 0.7-1.3", "mg/dL", 6),
        ("Liver Function Panel (LFT)", "Biochemistry", "Blood", 80.0, "ALT: 7-56, AST: 10-40, Bilirubin: 0.1-1.2", "U/L", 8),
        ("Cardiac Troponin I (High-Sens)", "Cardiology", "Blood", 120.0, "<0.04", "ng/mL", 2),
        ("12-Lead Electrocardiogram (ECG)", "Cardiology", "Imaging/Trace", 90.0, "Normal Sinus Rhythm", "N/A", 1),
        ("Echocardiogram (2D Doppler)", "Cardiology", "Ultrasound", 350.0, "LVEF 55-65%, Normal Valves", "%", 4),
        ("Brain MRI with Contrast", "Radiology", "Imaging", 680.0, "No acute intracranial hemorrhage or mass effect", "N/A", 12),
        ("Chest X-Ray PA View", "Radiology", "X-Ray", 85.0, "Clear lung fields, normal cardiothoracic ratio", "N/A", 2)
    ]
    created_lab_tests = []
    for idx, (t_name, cat, stype, price, nrange, unit, tat) in enumerate(lab_tests_data):
        lt = LabTest(
            code=f"LAB-TST-{idx+1:04d}",
            name=t_name,
            category=cat,
            sample_type=stype,
            price=price,
            normal_range=nrange,
            units=unit,
            turnaround_hours=tat,
            description=f"Standard clinical automated testing protocol for {t_name}."
        )
        db.add(lt)
        created_lab_tests.append(lt)
    db.commit()

    # 8. Create Appointments & Clinical Consultations
    today = date.today()
    created_appointments = []

    # Historical and today appointments
    for i in range(-14, 8):
        app_date = today + timedelta(days=i)
        for doc_idx, doc in enumerate(created_doctors):
            for slot_idx, slot_time in enumerate(["09:00", "10:30", "14:00"]):
                pat = created_patients[(doc_idx * 3 + slot_idx + abs(i)) % len(created_patients)]
                status = AppointmentStatus.COMPLETED if i < 0 else (AppointmentStatus.CONFIRMED if i >= 0 else AppointmentStatus.CHECKED_IN)
                if i == 0 and slot_idx == 0:
                    status = AppointmentStatus.IN_CONSULTATION

                app = Appointment(
                    appointment_number=f"APT-2026-{len(created_appointments)+1000:04d}",
                    patient_id=pat.id,
                    doctor_id=doc.id,
                    department_id=doc.department_id,
                    branch_id=branch1.id,
                    appointment_date=app_date,
                    appointment_time=slot_time,
                    reason=f"Clinical evaluation for {doc.specialization} follow-up and symptom monitoring.",
                    status=status,
                    priority=PriorityLevel.ROUTINE if slot_idx != 1 else PriorityLevel.URGENT,
                    notes="Patient advised to bring past medical records and fasting reports."
                )
                db.add(app)
                created_appointments.append(app)
    db.commit()

    # 9. Create OPD Queue Tokens
    opd_tokens = []
    for t_idx in range(1, 9):
        p = created_patients[t_idx]
        d = created_doctors[t_idx % len(created_doctors)]
        t_stat = OpdTokenStatus.IN_CONSULTATION if t_idx == 1 else (OpdTokenStatus.CALLED if t_idx == 2 else OpdTokenStatus.WAITING)
        token = OpdQueueToken(
            token_number=f"{d.department.code[:2]}-{t_idx+20:03d}",
            token_date=today,
            patient_id=p.id,
            doctor_id=d.id,
            department_id=d.department_id,
            branch_id=branch1.id,
            status=t_stat,
            priority=PriorityLevel.ROUTINE if t_idx > 2 else PriorityLevel.URGENT,
            estimated_wait_minutes=t_idx * 12,
            called_at=datetime.utcnow() - timedelta(minutes=5) if t_idx <= 2 else None,
            symptoms="Persistent palpitations and mild exertional fatigue",
            vitals={"bp": "124/82", "pulse": 78, "spo2": 99, "temp": 98.4}
        )
        db.add(token)
        opd_tokens.append(token)
    db.commit()

    # 10. Create Emergency Episodes
    emg_episodes = [
        EmergencyEpisode(
            emergency_number="EMG-2026-0001",
            patient_id=created_patients[0].id,
            arrival_time=datetime.utcnow() - timedelta(hours=1),
            arrival_method=EmergencyArrivalMethod.AMBULANCE,
            triage_level=EmergencyTriageLevel.RED,
            chief_complaint="Severe crushing retrosternal chest pain radiating to left arm with diaphoresis",
            vitals={"bp": "88/54", "pulse": 134, "spo2": 91, "gcs": 15, "pain_score": 10},
            priority_score=1,
            assigned_doctor_id=created_doctors[0].id,
            assigned_nurse_id=created_users["nurse.emily@medivanta.health"].id,
            emergency_bed_id=created_beds[16].id,
            status=EmergencyStatus.UNDER_TREATMENT,
            treatment_notes="IV access established. STAT ECG performed (shows ST elevation V1-V4). Administered Dual Antiplatelet & Heparin bolus. Cath lab alerted."
        ),
        EmergencyEpisode(
            emergency_number="EMG-2026-0002",
            patient_id=created_patients[1].id,
            arrival_time=datetime.utcnow() - timedelta(hours=3),
            arrival_method=EmergencyArrivalMethod.WALK_IN,
            triage_level=EmergencyTriageLevel.YELLOW,
            chief_complaint="Acute right lower quadrant abdominal pain with rebound tenderness and fever 101.4F",
            vitals={"bp": "118/76", "pulse": 98, "spo2": 98, "temp": 101.4, "pain_score": 8},
            priority_score=2,
            assigned_doctor_id=created_doctors[1].id,
            assigned_nurse_id=created_users["nurse.emily@medivanta.health"].id,
            emergency_bed_id=created_beds[17].id,
            status=EmergencyStatus.STABILIZED,
            treatment_notes="IV hydration started, urgent abdominal ultrasound and CBC ordered to evaluate acute appendicitis."
        )
    ]
    db.add_all(emg_episodes)
    db.commit()

    # 11. Create Inpatient Admissions, Bed Transfers & Doctor Rounds
    adm1 = Admission(
        admission_number="ADM-2026-0001",
        patient_id=created_patients[0].id,
        doctor_id=created_doctors[0].id,
        bed_id=created_beds[0].id,
        branch_id=branch1.id,
        admission_date=datetime.utcnow() - timedelta(days=2),
        expected_discharge_date=today + timedelta(days=3),
        admission_reason="Acute Myocardial Infarction status-post primary PCI to proximal LAD.",
        status=AdmissionStatus.ADMITTED,
        treatment_plan="Post-PCI dual antiplatelet therapy, continuous telemetry, cardiac rehabilitation protocol."
    )
    created_beds[0].current_admission_id = 1
    db.add(adm1)
    db.flush()

    # Add Doctor Round
    round1 = DoctorRound(
        admission_id=adm1.id,
        doctor_id=created_doctors[0].id,
        round_datetime=datetime.utcnow() - timedelta(hours=4),
        patient_condition="Stable & Pain-Free",
        vitals={"bp": "118/74", "pulse": 68, "spo2": 99, "temp": 98.6},
        progress_notes="Patient is resting comfortably with zero angina. Femoral puncture site intact with no hematoma. Urine output adequate.",
        treatment_updates="Continue Metoprolol 25mg BID, Atorvastatin 80mg QHS. Mobilize with physical therapy this evening.",
        medication_changes="Discontinue IV Nitroglycerin infusion.",
        new_orders="STAT Serum Potassium and Serum Creatinine check at 18:00."
    )
    db.add(round1)

    # 12. Create Nursing Tasks, Observations & Shift Handover
    ntask1 = NursingTask(
        patient_id=created_patients[0].id,
        admission_id=adm1.id,
        assigned_nurse_id=created_users["nurse.emily@medivanta.health"].id,
        title="Check Q4H Vitals & Telemetry Rhythm",
        description="Monitor BP, Pulse, SpO2, and rhythm for premature ventricular complexes.",
        category=NursingTaskCategory.VITALS_CHECK,
        priority=PriorityLevel.URGENT,
        scheduled_time=datetime.utcnow() + timedelta(hours=1),
        status=NursingTaskStatus.PENDING
    )
    ntask2 = NursingTask(
        patient_id=created_patients[0].id,
        admission_id=adm1.id,
        assigned_nurse_id=created_users["nurse.emily@medivanta.health"].id,
        title="Administer Scheduled Dose of Enoxaparin 40mg SubQ",
        description="Verify puncture site and administer in abdominal wall.",
        category=NursingTaskCategory.MEDICATION,
        priority=PriorityLevel.ROUTINE,
        scheduled_time=datetime.utcnow() + timedelta(hours=2),
        status=NursingTaskStatus.PENDING
    )
    db.add(ntask1)
    db.add(ntask2)

    nnote = NursingNote(
        patient_id=created_patients[0].id,
        admission_id=adm1.id,
        nurse_id=created_users["nurse.emily@medivanta.health"].id,
        note_datetime=datetime.utcnow() - timedelta(hours=2),
        shift="Morning",
        subject="Cardiology ICU Routine Care & Dressing Inspection",
        observation="Patient alert and oriented x 4. Chest pain free. Groin puncture site clean, dry, and intact with distal pulses palpable +2 bilateral.",
        vitals={"bp": "120/78", "pulse": 70, "spo2": 99, "temp": 98.4},
        care_provided="Assisted with breakfast and morning hygiene. Administered morning oral cardiac meds."
    )
    db.add(nnote)

    handover = ShiftHandover(
        branch_id=branch1.id,
        ward_id=ward_icu.id,
        handover_from_nurse_id=created_users["nurse.emily@medivanta.health"].id,
        handover_to_nurse_id=created_users["admin@medivanta.health"].id,
        shift_date=today,
        shift_type="Morning to Evening",
        total_patients=8,
        critical_patients_summary="Bed ICU-001 (Johnathan Reynolds) - Post-PCI day 2, stable on dual antiplatelet. Monitor puncture site.",
        pending_tasks_summary="18:00 Electrolyte panel for ICU-001; 20:00 IV antibiotic dose for ICU-002.",
        handover_notes="All emergency crash carts checked and verified. ICU beds 1-4 occupied, beds 5-16 operational."
    )
    db.add(handover)

    # 13. Create Medication Administration Record (MAR)
    mar1 = MedicationAdministration(
        patient_id=created_patients[0].id,
        admission_id=adm1.id,
        medicine_name="Atorvastatin 80mg",
        dosage="80mg",
        route=MarRoute.ORAL,
        scheduled_time=datetime.utcnow() - timedelta(hours=14),
        actual_time=datetime.utcnow() - timedelta(hours=14, minutes=5),
        administered_by_nurse_id=created_users["nurse.emily@medivanta.health"].id,
        status=MarStatus.ADMINISTERED,
        notes="Patient tolerated well with water."
    )
    mar2 = MedicationAdministration(
        patient_id=created_patients[0].id,
        admission_id=adm1.id,
        medicine_name="Enoxaparin 40mg SubQ",
        dosage="40mg (0.4mL)",
        route=MarRoute.SC,
        scheduled_time=datetime.utcnow() + timedelta(hours=2),
        status=MarStatus.SCHEDULED,
        notes="Scheduled evening SubQ anticoagulant dose."
    )
    db.add(mar1)
    db.add(mar2)

    # 14. Create Insurance Policies & Claims
    ipol = InsurancePolicy(
        patient_id=created_patients[0].id,
        provider_name="Blue Cross Blue Shield Healthcare",
        policy_number="BCBS-GOLD-9948210",
        member_id="MEM-7749102",
        group_number="GRP-55410",
        coverage_amount=100000.0,
        remaining_coverage=88400.0,
        co_pay_percentage=10.0,
        valid_from=date(2026, 1, 1),
        valid_to=date(2026, 12, 31),
        pre_auth_required=True
    )
    db.add(ipol)
    db.flush()

    claim = InsuranceClaim(
        claim_number="CLM-2026-0001",
        patient_id=created_patients[0].id,
        policy_id=ipol.id,
        admission_id=adm1.id,
        total_claimed_amount=12400.0,
        approved_amount=11160.0,
        rejected_amount=0.0,
        patient_co_pay_amount=1240.0,
        status=InsuranceClaimStatus.APPROVED,
        pre_auth_status=PreAuthStatus.APPROVED,
        submission_date=datetime.utcnow() - timedelta(days=1),
        approval_date=datetime.utcnow() - timedelta(hours=6),
        diagnosis_codes="ICD-10: I21.0 (STEMI of anterior wall)",
        procedure_codes="CPT: 92928 (Percutaneous transcatheter coronary stent)",
        notes="Pre-authorization cashless clearance approved by BCBS Medical TPA."
    )
    db.add(claim)

    # 15. Create EMR, Prescriptions, Lab Orders and Invoices for Completed Appointments
    for idx, app in enumerate(created_appointments[:10]):
        mr = MedicalRecord(
            record_number=f"EMR-2026-{idx+1:04d}",
            patient_id=app.patient_id,
            doctor_id=app.doctor_id,
            appointment_id=app.id,
            visit_date=datetime.combine(app.appointment_date, datetime.min.time()) + timedelta(hours=10),
            symptoms="Mild chest tightness, episodic shortness of breath on exertion, elevated blood pressure.",
            vitals={"bp": f"{120 + idx%15}/{80 + idx%8}", "pulse": 72 + idx%10, "temp": 98.6, "spo2": 99, "weight": 74 + idx, "bmi": 23.4},
            diagnosis="Essential Hypertension & Mild Hyperlipidemia (ICD-10: I10, E78.5)",
            clinical_notes="Patient advised lifestyle modifications including low-sodium DASH diet and 30 minutes of aerobic exercise daily.",
            treatment_plan="Initiated monotherapy with Amlodipine 5mg OD and Atorvastatin 20mg QHS.",
            follow_up_date=today + timedelta(days=30)
        )
        db.add(mr)
        db.flush()

        rx = Prescription(
            prescription_number=f"RX-2026-{idx+1:04d}",
            patient_id=app.patient_id,
            doctor_id=app.doctor_id,
            medical_record_id=mr.id,
            date_issued=mr.visit_date,
            status=PrescriptionStatus.DISPENSED,
            notes="Take with meals. Report any dizziness or lower extremity swelling."
        )
        db.add(rx)
        db.flush()

        db.add(PrescriptionItem(prescription_id=rx.id, medicine_id=created_medicines[1].id, medicine_name="Amlodipine 5mg", dosage="5mg", frequency="1-0-0 (Morning after food)", duration="30 Days", instructions="Take with full glass of water", quantity=30, dispensed_qty=30))
        db.add(PrescriptionItem(prescription_id=rx.id, medicine_id=created_medicines[0].id, medicine_name="Atorvastatin 20mg", dosage="20mg", frequency="0-0-1 (Night at bedtime)", duration="30 Days", instructions="Take at night after food", quantity=30, dispensed_qty=30))

        # Lab Order
        lo = LabOrder(
            order_number=f"LAB-ORD-{idx+1:04d}",
            patient_id=app.patient_id,
            doctor_id=app.doctor_id,
            medical_record_id=mr.id,
            order_date=mr.visit_date,
            status=LabStatus.VERIFIED,
            priority=PriorityLevel.ROUTINE,
            sample_collected_at=mr.visit_date + timedelta(minutes=20),
            completed_at=mr.visit_date + timedelta(hours=3),
            notes="Routine fasting biochemical panel."
        )
        db.add(lo)
        db.flush()

        db.add(LabOrderItem(lab_order_id=lo.id, lab_test_id=created_lab_tests[0].id, result_value="14.8 g/dL (Hb) | WBC: 7.2 | Platelets: 280", reference_range="Hb: 13.5-17.5 g/dL", unit="g/dL", flag=LabFlag.NORMAL, verified_by_name="Marcus Sterling, MLS", verified_at=mr.visit_date + timedelta(hours=3)))
        db.add(LabOrderItem(lab_order_id=lo.id, lab_test_id=created_lab_tests[1].id, result_value="Chol: 184 | Trig: 138 | HDL: 48 | LDL: 108", reference_range="Chol: <200, LDL: <100", unit="mg/dL", flag=LabFlag.NORMAL, verified_by_name="Marcus Sterling, MLS", verified_at=mr.visit_date + timedelta(hours=3)))

        # Invoice
        inv = Invoice(
            invoice_number=f"INV-2026-{idx+1001:04d}",
            patient_id=app.patient_id,
            appointment_id=app.id,
            branch_id=branch1.id,
            total_amount=360.0,
            discount=0.0,
            tax=0.0,
            grand_total=360.0,
            paid_amount=360.0,
            balance_amount=0.0,
            status=InvoiceStatus.PAID,
            issue_date=mr.visit_date,
            due_date=today,
            notes="Settled via insurance cashless clearance & debit card."
        )
        db.add(inv)
        db.flush()

        db.add(InvoiceItem(invoice_id=inv.id, item_type=ItemType.CONSULTATION, description="Consultant Specialist Consultation", quantity=1, unit_price=250.0, total_price=250.0))
        db.add(InvoiceItem(invoice_id=inv.id, item_type=ItemType.LAB_TEST, description="Complete Blood Count (CBC)", quantity=1, unit_price=45.0, total_price=45.0))
        db.add(InvoiceItem(invoice_id=inv.id, item_type=ItemType.LAB_TEST, description="Comprehensive Lipid Profile", quantity=1, unit_price=65.0, total_price=65.0))

        db.add(Payment(
            payment_number=f"PAY-2026-{inv.id:04d}",
            invoice_id=inv.id,
            patient_id=app.patient_id,
            amount=360.0,
            payment_method=PaymentMethod.INSURANCE,
            transaction_reference=f"TXN-INS-{random.randint(100000, 999999)}",
            payment_date=mr.visit_date,
            received_by="Sophia Montgomery (Billing Desk)"
        ))

    db.commit()

    # 16. Create Notifications & Audit Logs
    for user_email, u in created_users.items():
        db.add(Notification(
            user_id=u.id,
            title="Welcome to Medivanta AI Enterprise",
            message=f"Welcome to Medivanta AI Hospital Platform. Your role is configured as {u.role.value}.",
            type="SUCCESS",
            is_read=False
        ))

    db.commit()
    print("Medivanta AI Enterprise Hospital database successfully seeded with full multi-hospital ecosystem!")
