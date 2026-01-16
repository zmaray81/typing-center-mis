import PDFDocument from "pdfkit";
import path from "path";
import fs from "fs";

function formatDate(dateString) {
  try {
    if (!dateString) return '-';
    
    // If it's already a formatted date, return as is
    if (typeof dateString === 'string' && dateString.includes('-')) {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    }
    
    // If it's a Date object or timestamp
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  } catch (err) {
    console.error('Date formatting error:', err);
    return dateString || '-';
  }
}

export function generateInvoicePDF(invoice, res) {
  const doc = new PDFDocument({
    size: "A4",
    margin: 40,
    autoFirstPage: true
  });

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename=Invoice-${invoice.invoice_number}.pdf`
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

  doc.fontSize(9);

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

  /* ================= INVOICE CARD ================= */
  doc
    .rect(40, y, 515, 80)
    .fillColor("#f7fafc")
    .fill()
    .strokeColor(BORDER_COLOR)
    .stroke();

  y += 20;

  doc.fillColor("#2d3748").font("Helvetica").fontSize(9);

  // LEFT COLUMN - Client Info
  doc.text(`Client Name`, 50, y);
  doc.font("Helvetica-Bold").text(`: ${invoice.client_name || "Client"}`, 120, y);

  if (invoice.service_type) {
    doc.font("Helvetica").text(`Service Type`, 50, y + 20);
    doc.font("Helvetica-Bold").text(`: ${invoice.service_type.replace(/_/g, " ").toUpperCase()}`, 120, y + 20);
  }

  let infoOffset = 20;
  if (invoice.license_type) {
    doc.font("Helvetica").text(`License Type`, 50, y + 20 + infoOffset);
    doc.font("Helvetica-Bold").text(`: ${invoice.license_type}`, 120, y + 20 + infoOffset);
    infoOffset += 20;
  }

  if (invoice.activity) {
    doc.font("Helvetica").text(`Activity`, 50, y + 20 + infoOffset);
    doc.font("Helvetica-Bold").text(`: ${invoice.activity}`, 120, y + 20 + infoOffset);
  }

  // RIGHT COLUMN - Invoice Info
  doc.font("Helvetica").text(`Invoice No`, 350, y);
  doc.font("Helvetica-Bold").text(`: ${invoice.invoice_number}`, 420, y, { align: "left" });

  doc.font("Helvetica").text(`Date`, 350, y + 20);
doc.font("Helvetica-Bold").text(`: ${formatDate(invoice.date)}`, 420, y + 20, { align: "left" });

  doc.font("Helvetica").text(`Status`, 350, y + 40);
  const statusColor = invoice.payment_status === 'paid' ? '#10b981' :
                     invoice.payment_status === 'partial' ? '#f59e0b' : '#ef4444';
  doc.fillColor(statusColor).font("Helvetica-Bold").text(`: ${invoice.payment_status.toUpperCase()}`, 420, y + 40, { align: "left" });
  doc.fillColor("#2d3748");

  y += 65;

  /* ================= SERVICES TABLE HEADER ================= */
  y += 5;

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
    .text("Description", 80, y + 6)
    .text("Amount (AED)", 480, y + 6, { align: "right" });

  y += 25;

  doc
    .strokeColor(BORDER_COLOR)
    .moveTo(40, y)
    .lineTo(555, y)
    .stroke();

  y += 5;

  /* ================= PERSON NAME (if exists) ================= */
  doc.font("Helvetica").fontSize(10).fillColor("#2d3748");

  if (invoice.person_name) {
    doc
      .font("Helvetica-Oblique")
      .fontSize(9)
      .text(`${invoice.person_name}`, 55, y);
    y += 15;
  }

  /* ================= SERVICES LIST ================= */
  let itemNumber = 1;
  // Ensure items is an array (PostgreSQL JSONB returns as object/array)
  const items = Array.isArray(invoice.items) ? invoice.items : [];
  
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
  y += 10;

  // Top border for totals
  doc
    .strokeColor(BORDER_COLOR)
    .moveTo(350, y)
    .lineTo(555, y)
    .stroke();

  y += 8;

  // Subtotal
  doc.text("Subtotal (AED)", 350, y);
  doc.text(invoice.subtotal.toFixed(2), 480, y, { align: "right" });

  y += 15;

  // VAT if included
  if (invoice.include_vat) {
    doc.text("VAT (5%)", 350, y);
    doc.text(invoice.vat_amount.toFixed(2), 480, y, { align: "right" });
    y += 15;
  }

  // Double line before total
  doc
    .strokeColor(BORDER_COLOR)
    .moveTo(350, y)
    .lineTo(555, y)
    .stroke();

  y += 2;

  doc
    .strokeColor(BORDER_COLOR)
    .moveTo(350, y)
    .lineTo(555, y)
    .stroke();

  y += 8;

  // Total with highlight
  const totalText = invoice.total.toFixed(2);

  // Draw highlight box
  doc
    .rect(345, y - 5, 210, 25)
    .fillColor("#ebf8ff")
    .fill()
    .strokeColor(HIGHLIGHT_COLOR)
    .stroke();

  // Draw the text on top
  doc
    .fillColor(PRIMARY_COLOR)
    .font("Helvetica-Bold")
    .fontSize(10)
    .text("Total Amount (AED)", 350, y)
    .text(totalText, 480, y, { align: "right" });

  // Payment summary if any payments
  // Ensure payments is an array
  const payments = Array.isArray(invoice.payments) ? invoice.payments : [];
  if (payments.length > 0) {
    y += 20;

    doc
      .fillColor("#2d3748")
      .font("Helvetica-Bold")
      .fontSize(10)
      .text("Payment Summary:", 40, y);

    y += 12;

    // Cash payments
    const cashTotal = payments
      .filter(p => p.method === 'cash')
      .reduce((sum, p) => sum + (p.amount || 0), 0);

    if (cashTotal > 0) {
      doc.text("Cash Received:", 40, y);
      doc.text(cashTotal.toFixed(2), 480, y, { align: "right" });
      y += 15;
    }

    // Bank transfers
    const bankTotal = payments
      .filter(p => p.method === 'bank_transfer')
      .reduce((sum, p) => sum + (p.amount || 0), 0);

    if (bankTotal > 0) {
      doc.text("Bank Transfer:", 40, y);
      doc.text(bankTotal.toFixed(2), 480, y, { align: "right" });
      y += 15;
    }

    // Balance
    y += 3;
    doc
      .strokeColor(BORDER_COLOR)
      .moveTo(40, y)
      .lineTo(555, y)
      .stroke();

    y += 8;

    const balanceColor = invoice.balance > 0 ? "#ef4444" : "#10b981";
    doc.fillColor(balanceColor).font("Helvetica-Bold");
    doc.text("Balance Due (AED):", 40, y);
    doc.text(invoice.balance.toFixed(2), 480, y, { align: "right" });
    doc.fillColor("#2d3748");
  }

  /* ================= AMOUNT IN WORDS ================= */
  y += 20;

  // Fix: Show amount in words for BALANCE, not total if payments made
  const amountForWords = invoice.balance > 0 && payments.length > 0
    ? invoice.balance
    : invoice.total;

  if (y < PAGE_BOTTOM - 60) {
    doc
      .font("Helvetica-Bold")
      .fontSize(10)
      .text("Amount in Words:", 40, y);

    doc
      .font("Helvetica")
      .text(`AED ${numberToWords(amountForWords)} Only`, 130, y);
  }

  /* ================= BANK DETAILS ================= */
  y += 20;

  if (y < PAGE_BOTTOM - 100) {
    doc
      .rect(40, y, 515, 50)
      .fillColor("#f8fafc")
      .fill()
      .strokeColor(BORDER_COLOR)
      .stroke();

    doc
      .fillColor(PRIMARY_COLOR)
      .font("Helvetica-Bold")
      .fontSize(10)
      .text("Bank Details:", 50, y + 12);

    doc
      .fillColor("#2d3748")
      .font("Helvetica")
      .fontSize(8)
      .text("ADCB Bank", 50, y + 25)
      .text("Al Dayera Al Naqiya Typing Services", 50, y + 35)
      .text("Account: AE070030011476691820001", 50, y + 45);
  }

  /* ================= CLOSING NOTE ================= */
  const thanksY = Math.max(y + 50 + 10, 600);

  if (thanksY < PAGE_BOTTOM - 50) {
    doc
      .fillColor(PRIMARY_COLOR)
      .font("Helvetica-Bold")
      .fontSize(9)
      .text("Thanks and Best Regards,", 40, thanksY)
      .text("Accounts Department", 40, thanksY + 10);
  }

  /* ================= SYSTEM GENERATED NOTE ================= */
  const noteY = Math.max(thanksY + 50, 680);

  if (noteY < PAGE_BOTTOM - 30) {
    doc
      .fillColor("#718096")
      .font("Helvetica-Oblique")
      .fontSize(8)
      .text(
        "This is a system-generated document and does not require a signature.",
        40,
        noteY,
        { width: 515, align: "center" }
      );
  }

  /* ================= FOOTER ================= */
  const footerY = 770;

  // Footer separator
  doc
    .strokeColor(BORDER_COLOR)
    .lineWidth(0.5)
    .moveTo(40, footerY - 15)
    .lineTo(555, footerY - 15)
    .stroke();

  doc.lineWidth(1);

  doc
    .fillColor("#718096")
    .fontSize(8)
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
