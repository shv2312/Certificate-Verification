import io
import datetime
import qrcode
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Image

def generate_verification_pdf(record_data: dict) -> io.BytesIO:
    """
    Generate an official institutional verification report PDF for a completed verification request.
    Returns an in-memory BytesIO buffer containing the PDF binary.
    """
    buffer = io.BytesIO()
    
    # Setup document
    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        rightMargin=40,
        leftMargin=40,
        topMargin=36,
        bottomMargin=36
    )
    
    styles = getSampleStyleSheet()
    
    # Custom styles
    title_style = ParagraphStyle(
        'InstitutionalTitle',
        parent=styles['Heading1'],
        fontSize=15,
        leading=19,
        alignment=1,  # Center
        spaceAfter=3,
        textColor=colors.HexColor("#0f172a")
    )
    
    subtitle_style = ParagraphStyle(
        'Subtitle',
        parent=styles['Heading2'],
        fontSize=9.5,
        leading=13,
        alignment=1,  # Center
        spaceAfter=3,
        textColor=colors.HexColor("#334155")
    )
    
    report_title_style = ParagraphStyle(
        'ReportTitle',
        parent=styles['Heading3'],
        fontSize=11,
        leading=15,
        alignment=1,  # Center
        spaceAfter=14,
        textColor=colors.HexColor("#0f172a")
    )

    seal_header_style = ParagraphStyle(
        'SealHeader',
        parent=styles['Normal'],
        fontSize=8.5,
        leading=12,
        textColor=colors.HexColor("#0f172a")
    )

    elements = []
    
    # 1. Institutional Header
    elements.append(Paragraph("<b>SRI SHAKTHI INSTITUTE OF ENGINEERING AND TECHNOLOGY</b>", title_style))
    elements.append(Paragraph("COIMBATORE - 641 062 &nbsp;|&nbsp; Affiliated to Anna University, Chennai", subtitle_style))
    elements.append(Paragraph("<b>OFFICE OF THE CONTROLLER OF EXAMINATIONS — OFFICIAL VERIFICATION REPORT</b>", report_title_style))
    
    # 2. Candidate Transcript Table (4 columns)
    transcript_data = [
        ["Details", "Candidate's Input", "Verification (Y/N)", "Comments"],
        ["Candidate Name", record_data.get("candidate_name", "-"), "Y", "-"],
        ["Institute Name", "Sri Shakthi Institute of Engineering and Technology, Coimbatore", "Y", "-"],
        ["University Name", "Anna University, Chennai", "Y", "-"],
        ["Course Name", record_data.get("course", "Bachelor of Engineering"), "Y", "-"],
        ["Specialization", record_data.get("branch", "-"), "Y", "-"],
        ["Roll No/ Reg. No", record_data.get("register_number", "-"), "Y", "-"],
        ["Year of Passing", str(record_data.get("year_of_passing", "-")), "Y", "-"],
        ["Backlog Status", "Confirmed", "NO" if "No" in str(record_data.get("backlog_status", "No Backlogs")) else "YES", "-"],
        ["Date Attend / Period of Study", record_data.get("period_of_study", "-"), "Y", "-"],
        ["Mode Of Education", "Regular", "Y", "-"],
    ]
    
    t_table = Table(transcript_data, colWidths=[1.9 * inch, 3.1 * inch, 1.2 * inch, 0.8 * inch])
    t_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor("#f1f5f9")),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#cbd5e1")),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTNAME', (0, 1), (0, -1), 'Helvetica-Bold'),
        ('FONTNAME', (1, 1), (-1, -1), 'Helvetica'),
        ('ALIGN', (2, 1), (2, -1), 'CENTER'),
        ('ALIGN', (3, 1), (3, -1), 'CENTER'),
        ('FONTSIZE', (0, 0), (-1, -1), 8.5),
        ('PADDING', (0, 0), (-1, -1), 4.5),
    ]))
    
    elements.append(t_table)
    elements.append(Spacer(1, 0.25 * inch))
    
    # 3. Dynamic QR Code (1.5" x 1.5") pointing to verification status URL
    req_uuid = record_data.get("verification_request_id") or record_data.get("id") or record_data.get("display_request_id", "")
    verification_url = f"http://localhost:5173/status?id={req_uuid}"

    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_M,
        box_size=6,
        border=1
    )
    qr.add_data(verification_url)
    qr.make(fit=True)
    qr_img = qr.make_image(fill_color="black", back_color="white")
    
    img_buffer = io.BytesIO()
    qr_img.save(img_buffer, format="PNG")
    img_buffer.seek(0)
    
    qr_image = Image(img_buffer, width=1.5 * inch, height=1.5 * inch)

    # 4. Institutional Attestation & Digital Verification Seal Box
    display_req_id = record_data.get("display_request_id") or record_data.get("id", "N/A")
    timestamp_str = datetime.datetime.now().strftime("%d-%b-%Y %H:%M:%S UTC")

    seal_text = (
        f"<b>Digital Certificate Identifier:</b> {display_req_id}<br/>"
        f"<b>Authorized By:</b> College Verification Administrator<br/>"
        f"<b>Attestation Officer:</b> DR K E KANNAMMAL, HOD / CSE<br/>"
        f"<b>Timestamp:</b> {timestamp_str}<br/>"
        f"<b>Status:</b> <font color='#16a34a'><b>OFFICIALLY VERIFIED &amp; GENUINE</b></font><br/>"
        f"<font size=7 color='#64748b'>Scan QR code to verify authenticity on the SIET Portal</font>"
    )

    seal_left_flowable = Paragraph(seal_text, seal_header_style)

    # Table holding the metadata description and the 1.5" x 1.5" QR code cleanly side-by-side
    bottom_seal_table = Table(
        [[seal_left_flowable, qr_image]],
        colWidths=[5.2 * inch, 1.8 * inch]
    )
    bottom_seal_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor("#f8fafc")),
        ('BOX', (0, 0), (-1, -1), 1, colors.HexColor("#0f172a")),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('ALIGN', (1, 0), (1, 0), 'CENTER'),
        ('TOPPADDING', (0, 0), (-1, -1), 8),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
        ('LEFTPADDING', (0, 0), (0, 0), 12),
        ('RIGHTPADDING', (-1, -1), (-1, -1), 10),
    ]))

    elements.append(bottom_seal_table)
    
    # Build PDF
    doc.build(elements)
    
    buffer.seek(0)
    return buffer

