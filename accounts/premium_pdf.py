"""
Premium PDF generation functions for Optima Rewards vouchers
"""
import os
import requests
from io import BytesIO
from datetime import timedelta
from django.conf import settings
from django.utils import timezone
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Image, HRFlowable
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER
from reportlab.lib.colors import HexColor
from reportlab.lib.utils import ImageReader


def generate_premium_voucher_pdf(redemption):
    """Generate a premium luxury voucher PDF with enhanced design"""
    try:
        buffer = BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=letter, 
                              rightMargin=40, leftMargin=40, 
                              topMargin=40, bottomMargin=40)
        
        # Define premium styles
        styles = getSampleStyleSheet()
        
        # Premium color scheme
        primary_gold = HexColor('#D4AF37')      # Premium gold
        secondary_blue = HexColor('#1E3A8A')    # Deep blue
        accent_black = HexColor('#1F2937')      # Charcoal
        light_gold = HexColor('#FEF3C7')        # Light gold background
        text_dark = HexColor('#374151')         # Dark gray text
        success_green = HexColor('#059669')     # Success green
        
        # Main title style - Luxurious
        title_style = ParagraphStyle(
            'MainTitle',
            parent=styles['Heading1'],
            fontSize=36,
            spaceAfter=50,
            alignment=TA_CENTER,
            textColor=primary_gold,
            fontName='Helvetica-Bold',
            leading=42
        )
        
        # Subtitle style
        subtitle_style = ParagraphStyle(
            'Subtitle',
            parent=styles['Heading2'],
            fontSize=16,
            spaceAfter=40,
            alignment=TA_CENTER,
            textColor=secondary_blue,
            fontName='Helvetica',
            leading=20
        )
        
        # Voucher title style - Premium with border
        voucher_title_style = ParagraphStyle(
            'VoucherTitle',
            parent=styles['Heading2'],
            fontSize=28,
            spaceAfter=30,
            alignment=TA_CENTER,
            textColor=accent_black,
            fontName='Helvetica-Bold',
            leading=32,
            backColor=light_gold,
            borderWidth=4,
            borderColor=primary_gold,
            borderPadding=20,
            borderRadius=12
        )
        
        # Premium coupon code style
        coupon_style = ParagraphStyle(
            'CouponCode',
            parent=styles['Normal'],
            fontSize=24,
            spaceAfter=25,
            alignment=TA_CENTER,
            textColor=accent_black,
            fontName='Helvetica-Bold',
            backColor=HexColor('#FFFFFF'),
            borderWidth=4,
            borderColor=primary_gold,
            borderPadding=25,
            borderRadius=15,
            leading=28
        )
        
        # Section headers - Premium
        section_style = ParagraphStyle(
            'Section',
            parent=styles['Heading3'],
            fontSize=18,
            spaceAfter=15,
            spaceBefore=25,
            textColor=secondary_blue,
            fontName='Helvetica-Bold',
            leading=22
        )
        
        # Detail text - Clean and readable
        detail_style = ParagraphStyle(
            'Detail',
            parent=styles['Normal'],
            fontSize=13,
            spaceAfter=10,
            textColor=text_dark,
            fontName='Helvetica',
            leading=18
        )
        
        # Premium terms style
        terms_style = ParagraphStyle(
            'Terms',
            parent=styles['Normal'],
            fontSize=11,
            spaceAfter=8,
            textColor=text_dark,
            fontName='Helvetica',
            leftIndent=25,
            leading=15
        )
        
        # Status style for redemption info
        status_style = ParagraphStyle(
            'Status',
            parent=styles['Normal'],
            fontSize=14,
            spaceAfter=15,
            textColor=success_green,
            fontName='Helvetica-Bold',
            alignment=TA_CENTER,
            backColor=HexColor('#ECFDF5'),
            borderWidth=2,
            borderColor=success_green,
            borderPadding=12,
            borderRadius=8
        )

        # Build the story (content)
        story = []
        
        # Premium header with decorative elements
        story.append(Paragraph("✨ OPTIMA REWARDS ✨", title_style))
        story.append(Paragraph("Premium Voucher Certificate", subtitle_style))
        
        # Decorative line
        story.append(HRFlowable(width="100%", thickness=3, color=primary_gold))
        story.append(Spacer(1, 30))
        
        # Voucher Image (if available) - Enhanced styling
        if redemption.voucher.image_url:
            try:
                print(f"Loading premium image from URL: {redemption.voucher.image_url}")
                response = requests.get(redemption.voucher.image_url, timeout=10)
                
                if response.status_code == 200:
                    img_buffer = BytesIO(response.content)
                    img_reader = ImageReader(img_buffer)
                    
                    # Get original dimensions and scale appropriately
                    img_width, img_height = img_reader.getSize()
                    max_width = 300  # Larger for premium look
                    max_height = 200
                    
                    # Calculate scaled dimensions
                    scale_x = max_width / img_width
                    scale_y = max_height / img_height
                    scale = min(scale_x, scale_y)
                    
                    scaled_width = img_width * scale
                    scaled_height = img_height * scale
                    
                    # Create image with premium styling
                    img = Image(img_buffer, width=scaled_width, height=scaled_height)
                    img.hAlign = 'CENTER'
                    story.append(img)
                    story.append(Spacer(1, 20))
                    
            except Exception as e:
                print(f"Image loading failed: {e}")
                # Add placeholder for premium look
                story.append(Paragraph("🎁 Premium Voucher", voucher_title_style))
        
        # Voucher title with premium styling
        story.append(Paragraph(redemption.voucher.title, voucher_title_style))
        
        # Premium coupon code section
        story.append(Paragraph("REDEMPTION CODE", section_style))
        story.append(Paragraph(redemption.coupon_code, coupon_style))
        
        # Redemption status with premium styling
        story.append(Paragraph("✅ REDEEMED SUCCESSFULLY", status_style))
        
        # Voucher details in premium format
        story.append(Paragraph("VOUCHER DETAILS", section_style))
        
        details = [
            f"<b>Voucher:</b> {redemption.voucher.title}",
            f"<b>Points Used:</b> {redemption.points_used:,}",
            f"<b>Quantity:</b> {redemption.quantity}",
            f"<b>Redeemed On:</b> {(redemption.completed_at or timezone.now()).strftime('%B %d, %Y at %I:%M %p')}",
            f"<b>Valid Until:</b> {(redemption.completed_at or timezone.now()).date() + timedelta(days=365)}"
        ]
        
        for detail in details:
            story.append(Paragraph(detail, detail_style))
            story.append(Spacer(1, 8))
        
        # Description with premium styling
        if redemption.voucher.description:
            story.append(Paragraph("DESCRIPTION", section_style))
            description_text = redemption.voucher.description.replace('\n', '<br/>')
            story.append(Paragraph(description_text, detail_style))
            story.append(Spacer(1, 15))
        
        # Terms and conditions with premium styling
        if redemption.voucher.terms:
            story.append(Paragraph("TERMS & CONDITIONS", section_style))
            terms_text = redemption.voucher.terms.replace('\n', '<br/>')
            story.append(Paragraph(terms_text, terms_style))
        
        # Premium footer
        story.append(Spacer(1, 40))
        story.append(HRFlowable(width="100%", thickness=2, color=primary_gold))
        story.append(Spacer(1, 20))
        
        # Footer with premium branding
        footer_style = ParagraphStyle(
            'Footer',
            parent=styles['Normal'],
            fontSize=12,
            alignment=TA_CENTER,
            textColor=secondary_blue,
            fontName='Helvetica',
            leading=16
        )
        
        story.append(Paragraph("Thank you for choosing Optima Rewards", footer_style))
        story.append(Paragraph("Premium Banking • Premium Rewards • Premium Experience", footer_style))
        story.append(Spacer(1, 10))
        story.append(Paragraph(f"Generated on {timezone.now().strftime('%B %d, %Y at %I:%M %p')}", footer_style))
        
        # Build PDF
        doc.build(story)
        buffer.seek(0)
        
        # Save PDF to media directory with premium naming
        filename = f"premium_voucher_{redemption.id}.pdf"
        vouchers_dir = os.path.join(settings.MEDIA_ROOT, 'vouchers')
        os.makedirs(vouchers_dir, exist_ok=True)
        filepath = os.path.join(vouchers_dir, filename)
        
        with open(filepath, 'wb') as f:
            f.write(buffer.getvalue())

        # Return relative URL
        return f"{settings.MEDIA_URL}vouchers/{filename}"
        
    except Exception as e:
        print(f"Premium PDF generation error: {e}")
        raise e


def generate_premium_multi_voucher_pdf(redemptions):
    """Generate a premium multi-voucher PDF with luxury design"""
    try:
        buffer = BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=letter, 
                              rightMargin=40, leftMargin=40, 
                              topMargin=40, bottomMargin=40)
        
        # Define premium styles
        styles = getSampleStyleSheet()
        
        # Premium color scheme
        primary_gold = HexColor('#D4AF37')      # Premium gold
        secondary_blue = HexColor('#1E3A8A')    # Deep blue
        accent_black = HexColor('#1F2937')      # Charcoal
        light_gold = HexColor('#FEF3C7')        # Light gold background
        text_dark = HexColor('#374151')         # Dark gray text
        success_green = HexColor('#059669')     # Success green
        
        # Main title style - Luxurious
        title_style = ParagraphStyle(
            'MainTitle',
            parent=styles['Heading1'],
            fontSize=36,
            spaceAfter=40,
            alignment=TA_CENTER,
            textColor=primary_gold,
            fontName='Helvetica-Bold',
            leading=42
        )
        
        # Collection subtitle
        collection_style = ParagraphStyle(
            'Collection',
            parent=styles['Heading2'],
            fontSize=20,
            spaceAfter=30,
            alignment=TA_CENTER,
            textColor=secondary_blue,
            fontName='Helvetica-Bold',
            leading=24
        )
        
        # Individual voucher title style
        voucher_title_style = ParagraphStyle(
            'VoucherTitle',
            parent=styles['Heading3'],
            fontSize=18,
            spaceAfter=15,
            alignment=TA_CENTER,
            textColor=accent_black,
            fontName='Helvetica-Bold',
            leading=22,
            backColor=light_gold,
            borderWidth=2,
            borderColor=primary_gold,
            borderPadding=12,
            borderRadius=8
        )
        
        # Premium coupon code style
        coupon_style = ParagraphStyle(
            'CouponCode',
            parent=styles['Normal'],
            fontSize=16,
            spaceAfter=15,
            alignment=TA_CENTER,
            textColor=accent_black,
            fontName='Helvetica-Bold',
            backColor=HexColor('#FFFFFF'),
            borderWidth=2,
            borderColor=primary_gold,
            borderPadding=12,
            borderRadius=8,
            leading=20
        )
        
        # Section headers
        section_style = ParagraphStyle(
            'Section',
            parent=styles['Heading4'],
            fontSize=14,
            spaceAfter=10,
            spaceBefore=15,
            textColor=secondary_blue,
            fontName='Helvetica-Bold',
            leading=18
        )
        
        # Detail text
        detail_style = ParagraphStyle(
            'Detail',
            parent=styles['Normal'],
            fontSize=11,
            spaceAfter=6,
            textColor=text_dark,
            fontName='Helvetica',
            leading=15
        )
        
        # Terms style (condensed for multi-voucher)
        terms_style = ParagraphStyle(
            'Terms',
            parent=styles['Normal'],
            fontSize=9,
            spaceAfter=8,
            textColor=text_dark,
            fontName='Helvetica',
            leftIndent=15,
            leading=12
        )
        
        # Status style
        status_style = ParagraphStyle(
            'Status',
            parent=styles['Normal'],
            fontSize=12,
            spaceAfter=12,
            textColor=success_green,
            fontName='Helvetica-Bold',
            alignment=TA_CENTER,
            backColor=HexColor('#ECFDF5'),
            borderWidth=2,
            borderColor=success_green,
            borderPadding=8,
            borderRadius=6
        )

        # Build the story (content)
        story = []
        
        # Premium header
        story.append(Paragraph("✨ OPTIMA REWARDS ✨", title_style))
        story.append(Paragraph("Premium Voucher Collection", collection_style))
        story.append(Paragraph(f"Your {len(redemptions)} Premium Vouchers", collection_style))
        
        # Decorative line
        story.append(HRFlowable(width="100%", thickness=3, color=primary_gold))
        story.append(Spacer(1, 25))
        
        # Collection status
        story.append(Paragraph("✅ COLLECTION REDEEMED SUCCESSFULLY", status_style))
        story.append(Spacer(1, 20))
        
        # Add each voucher with premium styling
        for i, redemption in enumerate(redemptions, 1):
            try:
                # Voucher separator (except for first one)
                if i > 1:
                    story.append(Spacer(1, 15))
                    story.append(HRFlowable(width="80%", thickness=1, color=primary_gold, hAlign='CENTER'))
                    story.append(Spacer(1, 15))
                
                # Voucher number and title
                voucher_title = f"VOUCHER {i}: {redemption.voucher.title or f'Voucher {i}'}"
                story.append(Paragraph(voucher_title, voucher_title_style))
                
                # Coupon code
                coupon_code = redemption.coupon_code or "N/A"
                story.append(Paragraph(f"CODE: {coupon_code}", coupon_style))
                
                # Voucher details
                details = [
                    f"<b>Points Used:</b> {redemption.points_used:,}",
                    f"<b>Quantity:</b> {redemption.quantity}",
                    f"<b>Redeemed:</b> {(redemption.completed_at or timezone.now()).strftime('%m/%d/%Y %I:%M %p')}"
                ]
                
                for detail in details:
                    story.append(Paragraph(detail, detail_style))
                
                # Description (condensed)
                if redemption.voucher.description:
                    story.append(Paragraph("Description:", section_style))
                    description_text = redemption.voucher.description.replace('\n', '<br/>')
                    # Limit description length for multi-voucher
                    if len(description_text) > 150:
                        description_text = description_text[:150] + "..."
                    story.append(Paragraph(description_text, terms_style))
                
                # Terms (very condensed for multi-voucher)
                if redemption.voucher.terms:
                    story.append(Paragraph("Terms:", section_style))
                    terms_text = redemption.voucher.terms.replace('\n', '<br/>')
                    # Limit terms length for multi-voucher
                    if len(terms_text) > 100:
                        terms_text = terms_text[:100] + "..."
                    story.append(Paragraph(terms_text, terms_style))
                
            except Exception as e:
                print(f"Error processing voucher {i}: {e}")
                # Add a fallback entry
                story.append(Paragraph(f"Voucher {i}: {redemption.voucher.title or 'Unknown'}", voucher_title_style))
                story.append(Paragraph(f"Error processing this voucher: {str(e)}", detail_style))
                continue
        
        # Premium footer
        story.append(Spacer(1, 30))
        story.append(HRFlowable(width="100%", thickness=2, color=primary_gold))
        story.append(Spacer(1, 20))
        
        # Collection summary
        total_points = sum(r.points_used for r in redemptions)
        summary_style = ParagraphStyle(
            'Summary',
            parent=styles['Normal'],
            fontSize=14,
            alignment=TA_CENTER,
            textColor=secondary_blue,
            fontName='Helvetica-Bold',
            leading=18
        )
        
        story.append(Paragraph(f"Collection Summary: {len(redemptions)} vouchers • {total_points:,} total points", summary_style))
        story.append(Spacer(1, 15))
        
        # Footer
        footer_style = ParagraphStyle(
            'Footer',
            parent=styles['Normal'],
            fontSize=11,
            alignment=TA_CENTER,
            textColor=secondary_blue,
            fontName='Helvetica',
            leading=14
        )
        
        story.append(Paragraph("Thank you for choosing Optima Rewards", footer_style))
        story.append(Paragraph("Premium Banking • Premium Rewards • Premium Experience", footer_style))
        story.append(Spacer(1, 10))
        story.append(Paragraph(f"Generated on {timezone.now().strftime('%B %d, %Y at %I:%M %p')}", footer_style))
        
        # Build PDF
        doc.build(story)
        buffer.seek(0)
        
        # Save PDF to media directory with premium naming
        first_redemption = redemptions[0]
        filename = f"premium_collection_{first_redemption.id}_{len(redemptions)}_vouchers.pdf"
        vouchers_dir = os.path.join(settings.MEDIA_ROOT, 'vouchers')
        os.makedirs(vouchers_dir, exist_ok=True)
        filepath = os.path.join(vouchers_dir, filename)
        
        with open(filepath, 'wb') as f:
            f.write(buffer.getvalue())

        # Return relative URL
        return f"{settings.MEDIA_URL}vouchers/{filename}"
        
    except Exception as e:
        print(f"Premium multi-voucher PDF generation error: {e}")
        raise e
