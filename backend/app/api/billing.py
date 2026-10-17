from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status, Query, Response
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.models import (
    Invoice, InvoiceItem, InvoiceStatus, Payment, PaymentMethod,
    Patient, User, UserRole
)
from app.schemas.schemas import (
    InvoiceCreate, InvoiceResponse, PaymentCreate, PaymentResponse
)
from app.auth.deps import get_current_active_user, RoleChecker
from app.services.pdf_service import generate_invoice_pdf
from app.services.audit_service import log_audit
from app.services.notification_service import create_notification

router = APIRouter(prefix="/billing", tags=["Billing & Payments"])

@router.get("/invoices", response_model=List[InvoiceResponse])
def get_invoices(
    patient_id: Optional[int] = Query(None),
    status_filter: Optional[InvoiceStatus] = Query(None, alias="status"),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    query = db.query(Invoice)
    
    if current_user.role == UserRole.PATIENT:
        patient = db.query(Patient).filter(Patient.user_id == current_user.id).first()
        if patient:
            query = query.filter(Invoice.patient_id == patient.id)
        else:
            return []
    elif patient_id:
        query = query.filter(Invoice.patient_id == patient_id)

    if status_filter:
        query = query.filter(Invoice.status == status_filter)

    return query.order_by(Invoice.issue_date.desc()).all()

@router.post("/invoices", response_model=InvoiceResponse, status_code=status.HTTP_201_CREATED)
def create_invoice(
    inv_in: InvoiceCreate,
    current_user: User = Depends(RoleChecker([UserRole.ADMIN, UserRole.BILLING_STAFF, UserRole.RECEPTIONIST])),
    db: Session = Depends(get_db)
):
    count = db.query(Invoice).count() + 1001
    inv_number = f"INV-2026-{count}"

    total_amount = sum(item.quantity * item.unit_price for item in inv_in.items)
    grand_total = max(0.0, total_amount - inv_in.discount + inv_in.tax)

    invoice = Invoice(
        invoice_number=inv_number,
        patient_id=inv_in.patient_id,
        admission_id=inv_in.admission_id,
        appointment_id=inv_in.appointment_id,
        total_amount=round(total_amount, 2),
        discount=round(inv_in.discount, 2),
        tax=round(inv_in.tax, 2),
        grand_total=round(grand_total, 2),
        paid_amount=0.0,
        balance_amount=round(grand_total, 2),
        status=InvoiceStatus.PENDING,
        issue_date=datetime.utcnow(),
        due_date=inv_in.due_date,
        notes=inv_in.notes
    )
    db.add(invoice)
    db.flush()

    for it in inv_in.items:
        item_total = round(it.quantity * it.unit_price, 2)
        inv_item = InvoiceItem(
            invoice_id=invoice.id,
            item_type=it.item_type,
            description=it.description,
            quantity=it.quantity,
            unit_price=it.unit_price,
            total_price=item_total
        )
        db.add(inv_item)

    db.commit()
    db.refresh(invoice)

    # Notify patient
    patient = db.query(Patient).filter(Patient.id == invoice.patient_id).first()
    if patient and patient.user_id:
        create_notification(
            db,
            user_id=patient.user_id,
            title="New Invoice Generated",
            message=f"Invoice {invoice.invoice_number} for ${invoice.grand_total:.2f} has been generated.",
            type="INFO",
            link="/billing"
        )

    log_audit(db, "GENERATE_INVOICE", "Invoice", str(invoice.id), user=current_user, details=f"Generated invoice {inv_number} for ${invoice.grand_total:.2f}")
    return invoice

@router.post("/payments", response_model=PaymentResponse, status_code=status.HTTP_201_CREATED)
def record_payment(
    pay_in: PaymentCreate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    invoice = db.query(Invoice).filter(Invoice.id == pay_in.invoice_id).first()
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")

    if invoice.balance_amount <= 0:
        raise HTTPException(status_code=400, detail="This invoice is already fully paid")

    if pay_in.amount <= 0:
        raise HTTPException(status_code=400, detail="Payment amount must be greater than zero")

    count = db.query(Payment).count() + 1001
    pay_number = f"PAY-2026-{count}"

    payment = Payment(
        payment_number=pay_number,
        invoice_id=invoice.id,
        patient_id=invoice.patient_id,
        amount=pay_in.amount,
        payment_method=pay_in.payment_method,
        transaction_reference=pay_in.transaction_reference or f"TXN-{int(datetime.utcnow().timestamp())}",
        payment_date=datetime.utcnow(),
        notes=pay_in.notes,
        received_by=current_user.full_name
    )
    db.add(payment)

    # Update Invoice Balances & Status
    invoice.paid_amount = round(invoice.paid_amount + pay_in.amount, 2)
    invoice.balance_amount = max(0.0, round(invoice.grand_total - invoice.paid_amount, 2))
    
    if invoice.balance_amount <= 0.01:
        invoice.status = InvoiceStatus.PAID
    else:
        invoice.status = InvoiceStatus.PARTIALLY_PAID

    db.commit()
    db.refresh(payment)

    # Notify patient of receipt
    patient = db.query(Patient).filter(Patient.id == invoice.patient_id).first()
    if patient and patient.user_id:
        create_notification(
            db,
            user_id=patient.user_id,
            title="Payment Received",
            message=f"Payment of ${pay_in.amount:.2f} for invoice {invoice.invoice_number} was successfully processed.",
            type="SUCCESS",
            link="/billing"
        )

    log_audit(db, "RECORD_PAYMENT", "Payment", str(payment.id), user=current_user, details=f"Recorded payment {pay_number} for ${pay_in.amount:.2f}")
    return payment

@router.get("/invoices/{invoice_id}/pdf")
def download_invoice_pdf(
    invoice_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    invoice = db.query(Invoice).filter(Invoice.id == invoice_id).first()
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")

    patient = db.query(Patient).filter(Patient.id == invoice.patient_id).first()
    pdf_bytes = generate_invoice_pdf(invoice, patient)
    log_audit(db, "DOWNLOAD_INVOICE_PDF", "Invoice", str(invoice.id), user=current_user)

    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f"inline; filename={invoice.invoice_number}.pdf"}
    )
