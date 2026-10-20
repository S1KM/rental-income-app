/**
 * Financial & Date Formatting Utilities
 * Handles Indian Rupee Currency, DD-MMM-YYYY dates, and Number-to-Words
 */

export function formatINR(val) {
  return "₹" + Number(val || 0).toLocaleString("en-IN");
}

export function formatLedgerDate(dStr) {
  if (!dStr) return "";
  try {
    const parts = String(dStr).split("-");
    if (parts.length === 3 && parts[0].length === 4) {
      const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
      const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      const day = String(d.getDate()).padStart(2, "0");
      const month = months[d.getMonth()];
      const year = d.getFullYear();
      return `${day}-${month}-${year}`;
    }
    const d = new Date(dStr);
    if (!isNaN(d.getTime())) {
      const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      const day = String(d.getDate()).padStart(2, "0");
      const month = months[d.getMonth()];
      const year = d.getFullYear();
      return `${day}-${month}-${year}`;
    }
    return String(dStr);
  } catch {
    return String(dStr);
  }
}

export function parseLedgerDateToIso(dStr) {
  if (!dStr) return "";
  try {
    const parts = String(dStr).split("-");
    if (parts.length === 3 && parts[0].length === 4) {
      return dStr;
    }
    if (parts.length === 3 && parts[2].length === 4) {
      const months = { Jan: "01", Feb: "02", Mar: "03", Apr: "04", May: "05", Jun: "06", Jul: "07", Aug: "08", Sep: "09", Oct: "10", Nov: "11", Dec: "12" };
      const day = parts[0].padStart(2, "0");
      const m = months[parts[1]] || "01";
      const year = parts[2];
      return `${year}-${m}-${day}`;
    }
    const d = new Date(dStr);
    if (!isNaN(d.getTime())) {
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, "0");
      const dd = String(d.getDate()).padStart(2, "0");
      return `${yyyy}-${mm}-${dd}`;
    }
    return "";
  } catch {
    return "";
  }
}

export function formatDateReadable(dStr) {
  if (!dStr) return "DD-MM-YYYY";
  try {
    const d = new Date(dStr);
    if (isNaN(d.getTime())) return dStr;
    return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
  } catch {
    return dStr;
  }
}

export function getOrdinalDate(d) {
  const day = d.getDate();
  let suffix = "th";
  if (day === 1 || day === 21 || day === 31) suffix = "st";
  else if (day === 2 || day === 22) suffix = "nd";
  else if (day === 3 || day === 23) suffix = "rd";
  return `${day}${suffix}`;
}

export function numberToWords(num) {
  num = Math.floor(Number(num) || 0);
  if (num === 0) return "Zero Rupees";
  const a = [
    "", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten",
    "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"
  ];
  const b = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

  function convertTwoDigits(n) {
    if (n < 20) return a[n];
    const tens = b[Math.floor(n / 10)];
    const units = a[n % 10];
    return units ? `${tens} ${units}` : tens;
  }

  function convertThreeDigits(n) {
    let str = "";
    if (Math.floor(n / 100) > 0) {
      str += a[Math.floor(n / 100)] + " Hundred ";
    }
    const rem = n % 100;
    if (rem > 0) {
      str += (str ? "and " : "") + convertTwoDigits(rem);
    }
    return str.trim();
  }

  let words = "";
  const crore = Math.floor(num / 10000000);
  let remainder = num % 10000000;
  const lakh = Math.floor(remainder / 100000);
  remainder = remainder % 100000;
  const thousand = Math.floor(remainder / 1000);
  remainder = remainder % 1000;

  if (crore > 0) words += convertTwoDigits(crore) + " Crore ";
  if (lakh > 0) words += convertTwoDigits(lakh) + " Lakh ";
  if (thousand > 0) words += convertTwoDigits(thousand) + " Thousand ";
  if (remainder > 0) words += convertThreeDigits(remainder) + " ";

  return words.trim() + " Rupees Only";
}

export function escapeHtml(str) {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
