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
        topMargin=40,
        bottomMargin=40
    )
    
    styles = getSampleStyleSheet()
    
    # Custom styles
    title_style = ParagraphStyle(
        'InstitutionalTitle',
        parent=styles['Heading1'],
        fontSize=14,
        leading=18,
        alignment=1, # Center
        spaceAfter=2,
        textColor=colors.HexColor("#1e293b")
    )
    
    subtitle_style = ParagraphStyle(
        'Subtitle',
        parent=styles['Heading2'],
        fontSize=10,
        alignment=1, # Center
        spaceAfter=15,
        textColor=colors.HexColor("#475569")
    )
    
    report_title_style = ParagraphStyle(
        'ReportTitle',
        parent=styles['Heading3'],
        fontSize=12,
        alignment=1, # Center
        spaceAfter=20,
        textColor=colors.HexColor("#1e293b")
    )
    
    normal_style = styles['Normal']
    normal_style.fontSize = 10
    normal_style.leading = 14
    
    elements = []
    
    # 1. Header
    elements.append(Paragraph("<b>SRI SHAKTHI INSTITUTE OF ENGINEERING AND TECHNOLOGY</b>", title_style))
    elements.append(Paragraph("COIMBATORE - 641 062", subtitle_style))
    elements.append(Paragraph("(Affiliated to Anna University, Chennai)", subtitle_style))
    elements.append(Paragraph("<b>OFFICIAL ACADEMIC BACKGROUND VERIFICATION REPORT</b>", report_title_style))
    
    # 2. Verification Metadata Block
    req_id = record_data.get("display_request_id", "N/A")
    issued_date = datetime.datetime.now().strftime("%d-%b-%Y")
    
    meta_data = [
        ["Verification ID:", req_id, "Issued Date:", issued_date],
    ]
    
    meta_table = Table(meta_data, colWidths=[1.5 * inch, 2.5 * inch, 1.5 * inch, 1.5 * inch])
    meta_table.setStyle(TableStyle([
        ('FONTNAME', (0, 0), (-1, -1), 'Helvetica'),
        ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
        ('FONTNAME', (2, 0), (2, -1), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 9),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 10),
    ]))
    
    elements.append(meta_table)
    elements.append(Spacer(1, 0.2 * inch))
    
    # 3. Candidate Transcript Table (4 columns)
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
    
    t_table = Table(transcript_data, colWidths=[2.0 * inch, 3.0 * inch, 1.2 * inch, 0.8 * inch])
    t_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor("#f1f5f9")),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#cbd5e1")),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTNAME', (0, 1), (0, -1), 'Helvetica-Bold'),
        ('FONTNAME', (1, 1), (-1, -1), 'Helvetica'),
        ('ALIGN', (2, 1), (2, -1), 'CENTER'),
        ('ALIGN', (3, 1), (3, -1), 'CENTER'),
        ('FONTSIZE', (0, 0), (-1, -1), 9),
        ('PADDING', (0, 0), (-1, -1), 6),
    ]))
    
    elements.append(t_table)
    elements.append(Spacer(1, 0.5 * inch))
    
    # 4. Attestation Block
    # 2-column key-value signatory box at the bottom right.
    # Name: DR K E KANNAMMAL
    # Designation: HOD / Academic Verification Officer
    # Official Email: verification@siet.ac.in
    
    qr = qrcode.QRCode(version=1, box_size=4, border=1)
    verification_url = f"http://localhost:5173/status?id={record_data.get('verification_request_id', '')}"
    qr.add_data(verification_url)
    qr.make(fit=True)
    img = qr.make_image(fill_color="black", back_color="white")
    
    img_buffer = io.BytesIO()
    img.save(img_buffer, format="PNG")
    img_buffer.seek(0)
    
    qr_image = Image(img_buffer, width=1.0*inch, height=1.0*inch)
    
    signatory_data = [
        ["Name:", "DR K E KANNAMMAL"],
        ["Designation:", "HOD / Academic Verification Officer"],
        ["Official Email:", "verification@siet.ac.in"],
        ["Digital Stamp:", qr_image]
    ]
    
    sig_table = Table(signatory_data, colWidths=[1.5 * inch, 2.5 * inch])
    sig_table.setStyle(TableStyle([
        ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
        ('FONTNAME', (1, 0), (1, -1), 'Helvetica'),
        ('FONTSIZE', (0, 0), (-1, -1), 9),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
        ('TOPPADDING', (0, 0), (-1, -1), 4),
    ]))
    
    # Push it to the right
    layout_table = Table([["", sig_table]], colWidths=[3.0 * inch, 4.0 * inch])
    layout_table.setStyle(TableStyle([
        ('ALIGN', (1, 0), (1, 0), 'RIGHT'),
    ]))
    
    elements.append(layout_table)
    
    # Build PDF
    doc.build(elements)
    
    buffer.seek(0)
    return buffer
