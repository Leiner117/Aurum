var MONTHS = {
  Ene: 1, Feb: 2, Mar: 3, Abr: 4, May: 5, Jun: 6,
  Jul: 7, Ago: 8, Sep: 9, Oct: 10, Nov: 11, Dic: 12,
  Enero: 1, Febrero: 2, Marzo: 3, Abril: 4, Mayo: 5, Junio: 6,
  Julio: 7, Agosto: 8, Septiembre: 9, Octubre: 10, Noviembre: 11, Diciembre: 12
};

// Returns "YYYY-MM-DD" from "Ago 29, 2026" or "29 de Agosto de 2026"
function parseSpanishDate(text) {
  // Format: "Mes DD, YYYY"
  var m1 = text.match(/(\w+)\s+(\d{1,2}),\s*(\d{4})/);
  if (m1) {
    var month = MONTHS[m1[1]];
    if (month) {
      return m1[3] + "-" + String(month).padStart(2, "0") + "-" + m1[2].padStart(2, "0");
    }
  }
  // Format: "DD de MesCompleto de YYYY"
  var m2 = text.match(/(\d{1,2})\s+de\s+(\w+)\s+de\s+(\d{4})/i);
  if (m2) {
    var month2 = MONTHS[m2[2]];
    if (month2) {
      return m2[3] + "-" + String(month2).padStart(2, "0") + "-" + m2[1].padStart(2, "0");
    }
  }
  return null;
}

// Normalizes amount string to float: "3,525.00" or "3525,00" → 3525.00
function normalizeAmount(raw, currency) {
  var s = raw.trim();
  if (currency === "CRC") {
    // CRC: thousands dot, decimal comma → "3.525,00" or "3525,00"
    s = s.replace(/\./g, "").replace(",", ".");
  } else {
    // USD: thousands comma, decimal dot → "3,525.00" or "3.39"
    s = s.replace(/,/g, "");
  }
  return parseFloat(s);
}

// Returns { amount, currency, description, date, type } or null
function parseTransactionEmail(from, subject, plainBody) {
  if (from.indexOf("@baccredomatic.cr") !== -1) {
    return parseBac(subject, plainBody);
  }
  if (from.indexOf("@bncr.fi.cr") !== -1) {
    return parseBN(plainBody);
  }
  return null;
}

function parseBac(subject, body) {
  // Merchant from body
  var merchantMatch = body.match(/Comercio:\s*(.+)/i);
  // Fallback: extract from subject "Notificación de transacción {merchant} DD-MM-YYYY"
  var description = merchantMatch
    ? merchantMatch[1].trim().substring(0, 100)
    : (subject.replace(/Notificaci[oó]n de transacci[oó]n\s*/i, "").replace(/\s+\d{2}-\d{2}-\d{4}.*/, "").trim().substring(0, 100));

  var montoMatch = body.match(/Monto:\s*(USD|CRC)\s*([\d,.]+)/i);
  if (!montoMatch) return null;
  var currency = montoMatch[1].toUpperCase();
  var amount = normalizeAmount(montoMatch[2], currency);

  var fechaMatch = body.match(/Fecha:\s*(.+)/i);
  var date = fechaMatch ? parseSpanishDate(fechaMatch[1]) : null;
  if (!date) {
    // Try subject date: "29-08-2026"
    var subjDate = subject.match(/(\d{2})-(\d{2})-(\d{4})/);
    if (subjDate) date = subjDate[3] + "-" + subjDate[2] + "-" + subjDate[1];
  }

  var tipoMatch = body.match(/Tipo de Transacci[oó]n:\s*(\w+)/i);
  var tipo = tipoMatch ? tipoMatch[1].toUpperCase() : "COMPRA";
  var type = (tipo === "COMPRA" || tipo === "RETIRO" || tipo === "PAGO") ? "expense" : "expense";

  return { amount: amount, currency: currency, description: description, date: date || todayIso(), type: type };
}

function parseBN(body) {
  // Merchant: "comprobante de Compra realizada en {MERCHANT} el DD"
  var merchantMatch = body.match(/comprobante de (?:Compra|D[eé]bito|Cr[eé]dito) realizada en (.+?) el \d/i);
  var description = merchantMatch
    ? merchantMatch[1].replace(/\s+/g, " ").trim().substring(0, 100)
    : null;

  // Amount: "TOTAL:\nCRC 3525,00" or "TOTAL:\nUSD 3.39"
  var totalMatch = body.match(/TOTAL:\s*\n?\s*(CRC|USD)\s*([\d,.]+)/i);
  if (!totalMatch) return null;
  var currency = totalMatch[1].toUpperCase();
  var amount = normalizeAmount(totalMatch[2], currency);

  // Date: "Ago 29, 2026 - 08:28"
  var dateMatch = body.match(/(\w+\s+\d{1,2},\s*\d{4})\s*-\s*\d{2}:\d{2}/);
  var date = dateMatch ? parseSpanishDate(dateMatch[1]) : null;
  if (!date) {
    // Fallback: "29 de Agosto de 2026"
    var bodyDate = body.match(/el (\d{1,2} de \w+ de \d{4})/i);
    if (bodyDate) date = parseSpanishDate(bodyDate[1]);
  }

  var tipoMatch = body.match(/comprobante de (Compra|D[eé]bito|Cr[eé]dito|Dep[oó]sito)/i);
  var tipo = tipoMatch ? tipoMatch[1].toLowerCase() : "compra";
  var type = (tipo === "crédito" || tipo === "credito" || tipo === "depósito" || tipo === "deposito")
    ? "income" : "expense";

  return {
    amount: amount,
    currency: currency,
    description: description || "BN Transaction",
    date: date || todayIso(),
    type: type
  };
}
