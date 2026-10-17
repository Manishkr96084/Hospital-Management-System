import io
from datetime import datetime
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, 
    TableStyle, KeepTogether, HRFlowable
)
from app.core.config import settings

def create_header(doc_title: str):
    elements = []
    styles = getSampleStyleSheet()
    
    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Heading1'],
        fontSize=20,
        leading=24,
        textColor=colors.HexColor("#0f172a"),
        fontName="Helvetica-Bold",
        alignment=0
    )
    subtitle_style = ParagraphStyle(
        'DocSubtitle',
        parent=styles['Normal'],
        fontSize=9,
        leading=12,
        textColor=colors.HexColor("#64748b")
    )
    badge_style = ParagraphStyle(
        'DocBadge',
        parent=styles['Normal'],
        fontSize=12,
        leading=14,
        textColor=colors.HexColor("#2563eb"),
        fontName="Helvetica-Bold",
        alignment=2
    )

    header_data = [
        [
            Paragraph(f"<b>{settings.HOSPITAL_NAME}</b><br/>{settings.HOSPITAL_ADDRESS}<br/>Phone: {settings.HOSPITAL_PHONE} | {settings.HOSPITAL_EMAIL}", subtitle_style),
            Paragraph(f"<b>{doc_title.upper()}</b><br/><font color='#64748b' size=8>MEDIVANTA LUXURY HEALTHCARE</font>", badge_style)
        ]
    ]
    header_table = Table(header_data, colWidths=[340, 200])
    header_table.setStyle(TableStyle([
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('BOTTOMPADDING', (0,0), (-1,-1), 8),
    ]))
    elements.append(header_table)
    elements.append(HRFlowable(width="100%", thickness=1.5, color=colors.HexColor("#2563eb"), spaceAfter=15))
    return elements

def generate_invoice_pdf(invoice, patient) -> bytes:
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=letter, leftMargin=36, rightMargin=36, topMargin=36, bottomMargin=36)
    elements = create_header("Tax Invoice / Statement")
    styles = getSampleStyleSheet()
    
    # Metadata Box
    info_data = [
        [
            Paragraph(f"<b>Billed To:</b><br/>{patient.full_name}<br/>MRN: {patient.mrn}<br/>Phone: {patient.phone}<br/>Email: {patient.email or 'N/A'}", styles['Normal']),
            Paragraph(f"<b>Invoice #:</b> {invoice.invoice_number}<br/><b>Date:</b> {invoice.issue_date.strftime('%b %d, %Y')}<br/><b>Due Date:</b> {invoice.due_date or 'On Receipt'}<br/><b>Status:</b> <font color='{'green' if invoice.status.value == 'PAID' else 'orange'}'><b>{invoice.status.value}</b></font>", styles['Normal'])
        ]
    ]
    info_table = Table(info_data, colWidths=[270, 270])
    info_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor("#f8fafc")),
        ('PADDING', (0,0), (-1,-1), 10),
        ('BOX', (0,0), (-1,-1), 0.5, colors.HexColor("#e2e8f0")),
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
    ]))
    elements.append(info_table)
    elements.append(Spacer(1, 15))

    # Items Table
    table_data = [[
        Paragraph("<b>#</b>", styles['Normal']),
        Paragraph("<b>Description / Service</b>", styles['Normal']),
        Paragraph("<b>Type</b>", styles['Normal']),
        Paragraph("<b>Qty</b>", styles['Normal']),
        Paragraph("<b>Unit Price ($)</b>", styles['Normal']),
        Paragraph("<b>Total ($)</b>", styles['Normal'])
    ]]

    for idx, item in enumerate(invoice.items, 1):
        table_data.append([
            str(idx),
            Paragraph(item.description, styles['Normal']),
            item.item_type.value,
            str(item.quantity),
            f"${item.unit_price:.2f}",
            f"${item.total_price:.2f}"
        ])

    items_table = Table(table_data, colWidths=[30, 230, 90, 40, 70, 80])
    items_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor("#f1f5f9")),
        ('TEXTCOLOR', (0,0), (-1,0), colors.HexColor("#1e293b")),
        ('ALIGN', (0,0), (-1,-1), 'LEFT'),
        ('ALIGN', (3,0), (-1,-1), 'RIGHT'),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor("#cbd5e1")),
        ('PADDING', (0,0), (-1,-1), 6),
    ]))
    elements.append(items_table)
    elements.append(Spacer(1, 15))

    # Summary
    summary_data = [
        ["", "", "Subtotal:", f"${invoice.total_amount:.2f}"],
        ["", "", "Discount:", f"-${invoice.discount:.2f}"],
        ["", "", "Tax (EST):", f"${invoice.tax:.2f}"],
        ["", "", "Grand Total:", f"${invoice.grand_total:.2f}"],
        ["", "", "Amount Paid:", f"${invoice.paid_amount:.2f}"],
        ["", "", "Balance Due:", f"${invoice.balance_amount:.2f}"]
    ]
    summary_table = Table(summary_data, colWidths=[150, 150, 120, 120])
    summary_table.setStyle(TableStyle([
        ('ALIGN', (2,0), (-1,-1), 'RIGHT'),
        ('FONTNAME', (2,3), (3,3), 'Helvetica-Bold'),
        ('FONTNAME', (2,5), (3,5), 'Helvetica-Bold'),
        ('TEXTCOLOR', (2,5), (3,5), colors.HexColor("#dc2626") if invoice.balance_amount > 0 else colors.HexColor("#16a34a")),
        ('PADDING', (0,0), (-1,-1), 4),
    ]))
    elements.append(summary_table)
    elements.append(Spacer(1, 20))

    footer_text = Paragraph("<font color='#64748b' size=8>Thank you for choosing Medivanta Health. For billing queries, please contact concierge@medivanta.health. All payments are subject to hospital verification.</font>", styles['Normal'])
    elements.append(footer_text)

    doc.build(elements)
    buffer.seek(0)
    return buffer.getvalue()

def generate_prescription_pdf(prescription, patient, doctor) -> bytes:
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=letter, leftMargin=36, rightMargin=36, topMargin=36, bottomMargin=36)
    elements = create_header("Medical Prescription (Rx)")
    styles = getSampleStyleSheet()

    info_data = [
        [
            Paragraph(f"<b>Patient:</b> {patient.full_name}<br/><b>MRN:</b> {patient.mrn}<br/><b>Age/Gender:</b> {patient.gender}, Blood: {patient.blood_group or 'N/A'}<br/><b>Allergies:</b> <font color='red'>{patient.allergies or 'None Reported'}</font>", styles['Normal']),
            Paragraph(f"<b>Prescribing Doctor:</b><br/>Dr. {doctor.user.full_name if doctor.user else 'Consultant'}<br/>{doctor.specialization} ({doctor.qualification})<br/><b>Date:</b> {prescription.date_issued.strftime('%b %d, %Y')}<br/><b>Rx #:</b> {prescription.prescription_number}", styles['Normal'])
        ]
    ]
    info_table = Table(info_data, colWidths=[270, 270])
    info_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor("#f8fafc")),
        ('PADDING', (0,0), (-1,-1), 8),
        ('BOX', (0,0), (-1,-1), 0.5, colors.HexColor("#e2e8f0")),
    ]))
    elements.append(info_table)
    elements.append(Spacer(1, 15))

    rx_heading = ParagraphStyle('RxHead', parent=styles['Heading2'], fontSize=16, textColor=colors.HexColor("#2563eb"))
    elements.append(Paragraph("<b>℞ Medications & Dosage Regimen</b>", rx_heading))
    elements.append(Spacer(1, 8))

    table_data = [[
        Paragraph("<b>#</b>", styles['Normal']),
        Paragraph("<b>Medicine Name</b>", styles['Normal']),
        Paragraph("<b>Dosage</b>", styles['Normal']),
        Paragraph("<b>Frequency</b>", styles['Normal']),
        Paragraph("<b>Duration</b>", styles['Normal']),
        Paragraph("<b>Instructions</b>", styles['Normal']),
        Paragraph("<b>Qty</b>", styles['Normal'])
    ]]

    for idx, item in enumerate(prescription.items, 1):
        table_data.append([
            str(idx),
            Paragraph(f"<b>{item.medicine_name}</b>", styles['Normal']),
            item.dosage,
            item.frequency,
            item.duration,
            Paragraph(item.instructions or "-", styles['Normal']),
            str(item.quantity)
        ])

    rx_table = Table(table_data, colWidths=[25, 140, 65, 85, 65, 120, 40])
    rx_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor("#e0f2fe")),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor("#cbd5e1")),
        ('PADDING', (0,0), (-1,-1), 6),
    ]))
    elements.append(rx_table)
    elements.append(Spacer(1, 15))

    if prescription.notes:
        elements.append(Paragraph(f"<b>Doctor's Clinical Advice:</b><br/>{prescription.notes}", styles['Normal']))
        elements.append(Spacer(1, 15))

    elements.append(Spacer(1, 20))
    doc_sign = [
        ["", Paragraph(f"<b>Dr. {doctor.user.full_name if doctor.user else 'Consultant'}</b><br/><font size=8 color='#64748b'>Authorized Signature / Medical Stamp</font>", styles['Normal'])]
    ]
    sign_table = Table(doc_sign, colWidths=[350, 190])
    sign_table.setStyle(TableStyle([('ALIGN', (1,0), (1,0), 'RIGHT')]))
    elements.append(sign_table)

    doc.build(elements)
    buffer.seek(0)
    return buffer.getvalue()

def generate_lab_report_pdf(lab_order, patient, doctor) -> bytes:
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=letter, leftMargin=36, rightMargin=36, topMargin=36, bottomMargin=36)
    elements = create_header("Diagnostic Laboratory Report")
    styles = getSampleStyleSheet()

    info_data = [
        [
            Paragraph(f"<b>Patient:</b> {patient.full_name} | MRN: {patient.mrn}<br/><b>Gender/Age:</b> {patient.gender}<br/><b>Referred By:</b> Dr. {doctor.user.full_name if doctor.user else 'Attending'}", styles['Normal']),
            Paragraph(f"<b>Order #:</b> {lab_order.order_number}<br/><b>Order Date:</b> {lab_order.order_date.strftime('%b %d, %Y')}<br/><b>Status:</b> <b>{lab_order.status.value}</b>", styles['Normal'])
        ]
    ]
    info_table = Table(info_data, colWidths=[270, 270])
    info_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor("#f8fafc")),
        ('PADDING', (0,0), (-1,-1), 8),
        ('BOX', (0,0), (-1,-1), 0.5, colors.HexColor("#e2e8f0")),
    ]))
    elements.append(info_table)
    elements.append(Spacer(1, 15))

    table_data = [[
        Paragraph("<b>Investigation / Test</b>", styles['Normal']),
        Paragraph("<b>Observed Result</b>", styles['Normal']),
        Paragraph("<b>Reference Range</b>", styles['Normal']),
        Paragraph("<b>Units</b>", styles['Normal']),
        Paragraph("<b>Flag</b>", styles['Normal']),
        Paragraph("<b>Verified By</b>", styles['Normal'])
    ]]

    for item in lab_order.items:
        test_name = item.lab_test.name if item.lab_test else "Test"
        flag_color = "#dc2626" if item.flag.value in ["HIGH", "CRITICAL", "LOW"] else "#16a34a"
        table_data.append([
            Paragraph(f"<b>{test_name}</b>", styles['Normal']),
            Paragraph(f"<b>{item.result_value or 'Pending'}</b>", styles['Normal']),
            item.reference_range or (item.lab_test.normal_range if item.lab_test else "-"),
            item.unit or (item.lab_test.units if item.lab_test else "-"),
            Paragraph(f"<font color='{flag_color}'><b>{item.flag.value}</b></font>", styles['Normal']),
            item.verified_by_name or "Lab Pathologist"
        ])

    report_table = Table(table_data, colWidths=[150, 90, 100, 50, 60, 90])
    report_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor("#ede9fe")),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor("#cbd5e1")),
        ('PADDING', (0,0), (-1,-1), 6),
    ]))
    elements.append(report_table)
    elements.append(Spacer(1, 20))

    elements.append(Paragraph("<font size=8 color='#64748b'>Note: Test results are calibrated according to Medivanta ISO/NABL certified clinical standards. Clinical correlation is recommended.</font>", styles['Normal']))

    doc.build(elements)
    buffer.seek(0)
    return buffer.getvalue()

def generate_discharge_summary_pdf(admission, patient, doctor) -> bytes:
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=letter, leftMargin=36, rightMargin=36, topMargin=36, bottomMargin=36)
    elements = create_header("Inpatient Discharge Summary")
    styles = getSampleStyleSheet()

    info_data = [
        [
            Paragraph(f"<b>Patient:</b> {patient.full_name}<br/><b>MRN:</b> {patient.mrn}<br/><b>Gender:</b> {patient.gender}<br/><b>Contact:</b> {patient.phone}", styles['Normal']),
            Paragraph(f"<b>Admission #:</b> {admission.admission_number}<br/><b>Admitted:</b> {admission.admission_date.strftime('%b %d, %Y')}<br/><b>Discharged:</b> {admission.discharge_date.strftime('%b %d, %Y') if admission.discharge_date else 'Active'}<br/><b>Room/Bed:</b> {admission.bed.bed_number if admission.bed else 'N/A'}", styles['Normal'])
        ]
    ]
    info_table = Table(info_data, colWidths=[270, 270])
    info_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor("#f8fafc")),
        ('PADDING', (0,0), (-1,-1), 8),
        ('BOX', (0,0), (-1,-1), 0.5, colors.HexColor("#e2e8f0")),
    ]))
    elements.append(info_table)
    elements.append(Spacer(1, 15))

    details = [
        ("Reason for Admission", admission.admission_reason),
        ("Final Diagnosis", admission.final_diagnosis or "Under clinical resolution"),
        ("Condition at Discharge", admission.discharge_condition or "Stable"),
        ("Clinical Discharge Summary & Course in Hospital", admission.discharge_summary or "Patient received inpatient care and achieved stability. Prescriptions and home care plan provided.")
    ]

    for title, desc in details:
        elements.append(Paragraph(f"<b>{title}:</b>", styles['Heading3']))
        elements.append(Paragraph(desc, styles['Normal']))
        elements.append(Spacer(1, 8))

    elements.append(Spacer(1, 20))
    doc_sign = [
        ["", Paragraph(f"<b>Dr. {doctor.user.full_name if doctor.user else 'Primary Consultant'}</b><br/><font size=8 color='#64748b'>Attending Physician / Department of {doctor.department.name if doctor.department else 'Medicine'}</font>", styles['Normal'])]
    ]
    sign_table = Table(doc_sign, colWidths=[320, 220])
    sign_table.setStyle(TableStyle([('ALIGN', (1,0), (1,0), 'RIGHT')]))
    elements.append(sign_table)

    doc.build(elements)
    buffer.seek(0)
    return buffer.getvalue()
