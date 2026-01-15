import PDFDocument from "pdfkit";
import path from "path";
import fs from "fs";

const SERVICE_LABELS = {
  full_visa_inside: "Full Visa Inside",
  full_visa_outside: "Full Visa Outside",
  labour_card_new_renewal: "Labour Card New / Renewal",
  visa_cancellation: "Visa Cancellation",
  labour_card_cancellation: "Labour Card Cancellation",
  contract_modification: "Contract Modification",
  company_license_renewal: "Company License Renewal",
  new_license: "New License",
  other: "Other",
};

export function generateQuotationPDF(quotation, res) {
  const doc = new PDFDocument({
    size: "A4",
    margin: 40,
    autoFirstPage: true
  });

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename=Quotation-${quotation.quotation_number}.pdf`
  );

  doc.pipe(res);

  /* ================= COLORS ================= */
  const PRIMARY_COLOR = "#1a365d";
  const ACCENT_COLOR = "#2d3748";
  const HIGHLIGHT_COLOR = "#2b6cb0";
  const BORDER_COLOR = "#e2e8f0";

  /* ================= PAGE FRAME ================= */
  const PAGE_BOTTOM = 750;
  let y = 40;

  /* ================= COMPANY HEADER WITH LOGO ================= */
  try {
    const logoPaths = [
      path.join(process.cwd(), 'src', 'utils', 'assets', 'logo.png'),
      path.join(process.cwd(), 'src', 'utils', 'assets', 'logo.jpg'),
    ];

    let logoPath = null;
    for (const p of logoPaths) {
      if (fs.existsSync(p)) {
        logoPath = p;
        break;
      }
    }

    if (logoPath) {
      doc.image(logoPath, (doc.page.width - 300) / 2, y, { width: 300, height: 50 });
    } else {
      doc
        .fillColor(PRIMARY_COLOR)
        .font("Helvetica-Bold")
        .fontSize(20)
        .text("Bab Alyusr Business Setup Services", 40, y);
    }
  } catch (err) {
    console.log("❌ Logo not found, using text header:", err.message);
    doc
      .fillColor(PRIMARY_COLOR)
      .font("Helvetica-Bold")
      .fontSize(20)
      .text("Bab Alyusr Business Setup Services", 40, y);
  }

  y += 50;

  // Header line
  doc
    .lineWidth(1.5)
    .moveTo(40, y)
    .lineTo(555, y)
    .strokeColor(PRIMARY_COLOR)
    .stroke();

  doc.lineWidth(1);
  y += 5;

  /* ================= QUOTATION CARD ================= */
  // Card background
  doc
    .rect(40, y, 515, 90)
    .fillColor("#f7fafc")
    .fill()
    .strokeColor(BORDER_COLOR)
    .stroke();

  y += 20;

  doc.fillColor("#2d3748").font("Helvetica").fontSize(10);

  const serviceType =
    quotation.service_category === "other"
      ? quotation.service_description || ""
      : quotation.service_category
      ? quotation.service_category.replace(/_/g, " ").toUpperCase()
      : "";

  // LEFT COLUMN
  doc.text(`Client Name`, 50, y);
  doc.font("Helvetica-Bold").text(`: ${quotation.client_name || "Walk-in Client"}`, 120, y);

  if (serviceType) {
    doc.font("Helvetica").text(`Service Type`, 50, y + 20);
    doc.font("Helvetica-Bold").text(`: ${serviceType}`, 120, y + 20);
  }

  let infoOffset = 20;
  if (quotation.license_type) {
    doc.font("Helvetica").text(`License Type`, 50, y + 20 + infoOffset);
    doc.font("Helvetica-Bold").text(`: ${quotation.license_type}`, 120, y + 20 + infoOffset);
    infoOffset += 20;
  }

  if (quotation.activity) {
    doc.font("Helvetica").text(`Activity`, 50, y + 20 + infoOffset);
    doc.font("Helvetica-Bold").text(`: ${quotation.activity}`, 120, y + 20 + infoOffset);
  }

  // RIGHT COLUMN
  doc.font("Helvetica").text(`Quotation No`, 350, y);
  doc.font("Helvetica-Bold").text(`: ${quotation.quotation_number}`, 420, y, { align: "left" });

  doc.font("Helvetica").text(`Date`, 350, y + 20);
  doc.font("Helvetica-Bold").text(`: ${quotation.date}`, 420, y + 20, { align: "left" });

  y += 90;

  /* ================= SERVICES TABLE HEADER ================= */
  if (quotation.description) {
    doc
      .fillColor(HIGHLIGHT_COLOR)
      .font("Helvetica-Bold")
      .fontSize(11)
      .text(quotation.description, 40, y);
    y += 25;
  }

  // Table header background
  doc
    .rect(40, y, 515, 20)
    .fillColor(PRIMARY_COLOR)
    .fill();

  doc
    .fillColor("white")
    .font("Helvetica-Bold")
    .fontSize(11)
    .text("#", 50, y + 6)
    .text("Service Description", 80, y + 6)
    .text("Amount (AED)", 480, y + 6, { align: "right" });

  y += 25;

  doc
    .strokeColor(BORDER_COLOR)
    .moveTo(40, y)
    .lineTo(555, y)
    .stroke();

  y += 10;

  /* ================= PERSON NAME (if exists) ================= */
  doc.font("Helvetica").fontSize(10).fillColor("#2d3748");

  if (quotation.person_name) {
    doc
      .font("Helvetica-Oblique")
      .fontSize(9)
      .text(`${quotation.person_name}`, 55, y);
    y += 20;
  }

  /* ================= SERVICES LIST ================= */
  let itemNumber = 1;
  // Ensure items is an array
  const items = Array.isArray(quotation.items) ? quotation.items : [];
  
  items.forEach((item, index) => {
    if (y > 520) return;

    // Alternate row background
    if (index % 2 === 0) {
      doc
        .rect(40, y - 5, 515, 20)
        .fillColor("#f7fafc")
        .fill();
    }

    doc.fillColor("#2d3748");

    // Item number
    doc.text(`${itemNumber++}.`, 50, y);

    // Description
    doc.text(item.description || "-", 80, y, { width: 360 });

    // Amount
    doc.text(
      Number(item.amount || 0).toFixed(2),
      480,
      y,
      { align: "right" }
    );

    y += 20;
  });

  /* ================= TOTALS SECTION ================= */
  y += 15;

  // Top border for totals
  doc
    .strokeColor(BORDER_COLOR)
    .moveTo(350, y)
    .lineTo(555, y)
    .stroke();

  y += 10;

  // Subtotal
  doc.text("Subtotal (AED)", 350, y);
  doc.text(quotation.subtotal.toFixed(2), 480, y, { align: "right" });

  y += 18;

  // VAT
  doc.text("VAT (5%)", 350, y);
  doc.text(quotation.vat_amount.toFixed(2), 480, y, { align: "right" });

  y += 18;

  // Double line before total
  doc
    .strokeColor(BORDER_COLOR)
    .moveTo(350, y)
    .lineTo(555, y)
    .stroke();
    
  y += 3;
  
  doc
    .strokeColor(BORDER_COLOR)
    .moveTo(350, y)
    .lineTo(555, y)
    .stroke();

  y += 10;

  // Total with highlight
  const totalText = quotation.total.toFixed(2);
  
  // Draw highlight box first
  doc
    .rect(345, y - 5, 210, 25)
    .fillColor("#ebf8ff")
    .fill()
    .strokeColor(HIGHLIGHT_COLOR)
    .stroke();

  // Now draw the text on top
  doc
    .fillColor(PRIMARY_COLOR)
    .font("Helvetica-Bold")
    .fontSize(12)
    .text("Total Amount (AED)", 350, y)
    .text(totalText, 480, y, { align: "right" });

  // Reset color
  doc.fillColor("#2d3748");

  /* ================= AMOUNT IN WORDS ================= */
  y += 50;

  if (y < PAGE_BOTTOM - 60) {
    doc
      .font("Helvetica-Bold")
      .fontSize(10)
      .text("Amount in Words:", 40, y);
    
    doc
      .font("Helvetica")
      .text(`AED ${numberToWords(quotation.total)} Only`, 130, y);
  }

  /* ================= CLOSING NOTE ================= */
  const thanksY = 620;
  const closingY = 700;

  doc
    .fillColor(PRIMARY_COLOR)
    .font("Helvetica-Bold")
    .fontSize(11)
    .text("Thanks and Best Regards,", 40, thanksY)
    .text("Accounts Department", 40, thanksY + 10);

  doc
    .fontSize(9)
    .fillColor("#718096")
    .text(
      "This is a system-generated document and does not require a signature.",
      40,
      closingY + 18,
      { width: 515, align: "center" }
    );

  /* ================= FOOTER ================= */
  const footerY = 770;

  // Footer separator
  doc
    .strokeColor(BORDER_COLOR)
    .lineWidth(0.5)
    .moveTo(40, footerY - 15)
    .lineTo(555, footerY - 15)
    .stroke();

  // Reset line width
  doc.lineWidth(1);

  doc
    .fillColor("#718096")
    .fontSize(9)
    .text(
      "Office No. 12, Dubai, UAE  |  Tel: 045528083  |  Mobile: 0501348974  |  bab.al.yusr81@gmail.com",
      40,
      footerY - 5,
      { width: 515, align: "center" }
    );

  doc.end();
}

/* ================= NUMBER TO WORDS ================= */
function numberToWords(amount) {
  if (!amount) return "Zero";

  const ones = ["","One","Two","Three","Four","Five","Six","Seven","Eight","Nine",
    "Ten","Eleven","Twelve","Thirteen","Fourteen","Fifteen","Sixteen","Seventeen","Eighteen","Nineteen"];
  const tens = ["","","Twenty","Thirty","Forty","Fifty","Sixty","Seventy","Eighty","Ninety"];

  const convert = (n) => {
    if (n < 20) return ones[n];
    if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 ? " " + ones[n % 10] : "");
    if (n < 1000)
      return ones[Math.floor(n / 100)] + " Hundred" +
        (n % 100 ? " " + convert(n % 100) : "");
    return convert(Math.floor(n / 1000)) + " Thousand " + convert(n % 1000);
  };

  return convert(Math.floor(amount));
}