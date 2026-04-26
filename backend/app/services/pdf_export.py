import logging
from io import BytesIO
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.units import cm
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, PageBreak
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_RIGHT
from datetime import datetime
from app.models.job import Job

logger = logging.getLogger(__name__)


def generate_job_pdf(job: Job) -> BytesIO:
    """Generate PDF for a job offer."""
    try:
        buffer = BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=A4, topMargin=1.5*cm, bottomMargin=1.5*cm)
        elements = []

        styles = getSampleStyleSheet()
        title_style = ParagraphStyle(
            "CustomTitle",
            parent=styles["Heading1"],
            fontSize=24,
            textColor=colors.HexColor("#1f2937"),
            spaceAfter=12,
            alignment=TA_CENTER,
        )

        heading_style = ParagraphStyle(
            "CustomHeading",
            parent=styles["Heading2"],
            fontSize=14,
            textColor=colors.HexColor("#374151"),
            spaceAfter=6,
            spaceBefore=12,
        )

        # Title
        title = Paragraph(job.title, title_style)
        elements.append(title)
        elements.append(Spacer(1, 0.3*cm))

        # Company and Location
        company_name = "N/A"
        try:
            if job.company:
                company_name = job.company.name
        except Exception:
            company_name = str(job.company_id) if job.company_id else "N/A"

        company_info = [
            ["Company:", company_name],
            ["Location:", job.location],
            ["Job Type:", job.job_type.value if hasattr(job.job_type, 'value') else str(job.job_type)],
            ["Domain:", job.domain or ""],
            ["Source:", job.source.value if hasattr(job.source, 'value') else str(job.source)],
        ]

        company_table = Table(company_info, colWidths=[3*cm, 12*cm])
        company_table.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (0, -1), colors.HexColor("#f3f4f6")),
            ("TEXTCOLOR", (0, 0), (-1, -1), colors.black),
            ("ALIGN", (0, 0), (-1, -1), "LEFT"),
            ("FONTNAME", (0, 0), (0, -1), "Helvetica-Bold"),
            ("FONTSIZE", (0, 0), (-1, -1), 11),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
            ("GRID", (0, 0), (-1, -1), 1, colors.grey),
        ]))
        elements.append(company_table)
        elements.append(Spacer(1, 0.5*cm))

        # Salary
        if job.salary_min or job.salary_max:
            elements.append(Paragraph("Salary", heading_style))
            salary_text = ""
            if job.salary_min and job.salary_max:
                salary_text = f"{job.salary_min:,} - {job.salary_max:,} {job.salary_currency}"
            elif job.salary_min:
                salary_text = f"From {job.salary_min:,} {job.salary_currency}"
            else:
                salary_text = f"Up to {job.salary_max:,} {job.salary_currency}"

            elements.append(Paragraph(salary_text, styles["Normal"]))
            elements.append(Spacer(1, 0.3*cm))

        # Description
        if job.description:
            elements.append(Paragraph("Description", heading_style))
            elements.append(Paragraph(job.description, styles["Normal"]))
            elements.append(Spacer(1, 0.3*cm))

        # Contact Information
        elements.append(Paragraph("Contact Information", heading_style))
        contact_data = []
        if job.email:
            contact_data.append(["Email:", job.email])
        if job.phone:
            contact_data.append(["Phone:", job.phone])
        if job.link:
            contact_data.append(["Job Link:", job.link])

        if contact_data:
            contact_table = Table(contact_data, colWidths=[3*cm, 12*cm])
            contact_table.setStyle(TableStyle([
                ("BACKGROUND", (0, 0), (0, -1), colors.HexColor("#f3f4f6")),
                ("TEXTCOLOR", (0, 0), (-1, -1), colors.black),
                ("ALIGN", (0, 0), (-1, -1), "LEFT"),
                ("FONTNAME", (0, 0), (0, -1), "Helvetica-Bold"),
                ("FONTSIZE", (0, 0), (-1, -1), 11),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
                ("GRID", (0, 0), (-1, -1), 1, colors.grey),
            ]))
            elements.append(contact_table)

        elements.append(Spacer(1, 1*cm))

        # Footer
        footer_text = f"Generated on {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}"
        elements.append(Paragraph(footer_text, styles["Normal"]))

        doc.build(elements)
        buffer.seek(0)
        return buffer
    except Exception as e:
        logger.error(f"Error generating PDF for job {job.id}: {str(e)}")
        raise
