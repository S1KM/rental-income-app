/**
 * Ledger Mathematics, Tenancy Health & Financial Running Balance Computation
 */

import { formatINR } from './formatters.js';

export function computeLeaseProgress(startDateStr, endDateStr) {
  if (!startDateStr || !endDateStr) {
    return { percent: 50, monthsPassed: 6, totalMonths: 11, daysLeft: 120, isExpiringSoon: false };
  }
  const start = new Date(startDateStr);
  const end = new Date(endDateStr);
  const now = new Date();
  const totalMs = Math.max(1, end.getTime() - start.getTime());
  const passedMs = Math.max(0, Math.min(totalMs, now.getTime() - start.getTime()));
  const percent = Math.min(100, Math.max(0, Math.round((passedMs / totalMs) * 100)));
  const totalMonths = Math.max(1, Math.round(totalMs / (30.44 * 24 * 60 * 60 * 1000)));
  const monthsPassed = Math.min(totalMonths, Math.max(1, Math.round(passedMs / (30.44 * 24 * 60 * 60 * 1000))));
  const daysLeft = Math.max(0, Math.round((end.getTime() - now.getTime()) / (24 * 60 * 60 * 1000)));
  return {
    percent,
    monthsPassed,
    totalMonths,
    daysLeft,
    isExpiringSoon: daysLeft <= 90 && daysLeft > 0
  };
}

export function computeTenantScore(tenant) {
  const os = Number(tenant.osAmount) || 0;
  const rent = Number(tenant.rent) || 12000;
  if (os === 0) {
    return {
      score: "5.0",
      rating: "Stellar (100% On-Time)",
      badgeColor: "emerald",
      badgeText: "⭐ 100% On-Time · ₹0 Dues",
      statusLabel: "Settled",
      historyDots: [
        { month: "May", status: "paid" },
        { month: "Jun", status: "paid" },
        { month: "Jul", status: "paid" },
        { month: "Aug", status: "paid" },
        { month: "Sep", status: "paid" },
        { month: "Oct", status: "paid" }
      ]
    };
  } else if (os <= rent) {
    return {
      score: "4.0",
      rating: "1 Month Overdue",
      badgeColor: "amber",
      badgeText: `⚠️ 1 Mo Due (${formatINR(os)})`,
      statusLabel: "Partial Due",
      historyDots: [
        { month: "May", status: "paid" },
        { month: "Jun", status: "paid" },
        { month: "Jul", status: "paid" },
        { month: "Aug", status: "paid" },
        { month: "Sep", status: "paid" },
        { month: "Oct", status: "due" }
      ]
    };
  } else {
    return {
      score: "2.5",
      rating: "Default Alert",
      badgeColor: "rose",
      badgeText: `🚨 Defaulter (${formatINR(os)})`,
      statusLabel: "Severe Dues",
      historyDots: [
        { month: "May", status: "paid" },
        { month: "Jun", status: "paid" },
        { month: "Jul", status: "paid" },
        { month: "Aug", status: "due" },
        { month: "Sep", status: "due" },
        { month: "Oct", status: "due" }
      ]
    };
  }
}

/**
 * Calculates Running Balance Ledger for a Property
 * Supports passing either an explicit state object or falling back to window.state / store
 */
export function generatePropertyLedgerData(propId, explicitTenant = null, stateObj = null) {
  const s = stateObj || (typeof window !== 'undefined' ? window.state : null);
  if (!s || !s.properties) return null;

  let prop = s.properties.find((p) => p.id === propId);
  if (!prop && s.properties.length > 0) {
    prop = s.properties[0];
  }
  if (!prop) return null;

  const tenant = explicitTenant || s.tenants.find(
    (t) => t.status !== "Vacated" && (t.unit || "").trim().toLowerCase() === (prop.name || "").trim().toLowerCase()
  );

  if (!tenant) {
    return {
      prop,
      tenant: null,
      isVacant: true,
      totalBilled: 0,
      totalReceived: 0,
      currentBalance: 0,
      rows: []
    };
  }

  const rent = Number(tenant.rent) || Number(prop.rent) || 12000;
  const currentOs = Math.max(0, Number(tenant.osAmount) || 0);

  // Standard 7-Month Tenancy Term Cycles (April 2026 to October 2026)
  const cycleDefinitions = [
    { cycle: "Apr 2026", dueDate: "05-Apr-2026", payDate: "03-Apr-2026", ref: "UPI/2604/77102" },
    { cycle: "May 2026", dueDate: "05-May-2026", payDate: "04-May-2026", ref: "UPI/2605/88219" },
    { cycle: "Jun 2026", dueDate: "05-Jun-2026", payDate: "05-Jun-2026", ref: "IMPS/617201/SBIN" },
    { cycle: "Jul 2026", dueDate: "05-Jul-2026", payDate: "02-Jul-2026", ref: "NEFT/N729014/HDFC" },
    { cycle: "Aug 2026", dueDate: "05-Aug-2026", payDate: "04-Aug-2026", ref: "UPI/2608/33918" },
    { cycle: "Sep 2026", dueDate: "05-Sep-2026", payDate: "05-Sep-2026", ref: "UPI/2609/44012" },
    { cycle: "Oct 2026", dueDate: "05-Oct-2026", payDate: "05-Oct-2026", ref: "UPI/2610/55120" }
  ];

  let runningBal = 0;
  let totalBilled = 0;
  let totalReceived = 0;
  const rows = [];

  cycleDefinitions.forEach((c, idx) => {
    const isLatest = (idx === cycleDefinitions.length - 1);
    const isPenultimate = (idx === cycleDefinitions.length - 2);
    const dueAmount = rent;
    const instKey = (prop.id || "") + "_" + c.cycle;

    let payments = [];
    if (s.ledgerInstallments && Array.isArray(s.ledgerInstallments[instKey])) {
      payments = JSON.parse(JSON.stringify(s.ledgerInstallments[instKey]));
    } else {
      // Default installment fixtures
      if (currentOs > 0) {
        if (isLatest) {
          if (currentOs >= rent) {
            payments = [];
          } else {
            const paidSoFar = rent - currentOs;
            if (paidSoFar >= 5000) {
              const p1 = Math.round(paidSoFar * 0.6);
              const p2 = paidSoFar - p1;
              payments = [
                { date: "05-Oct-2026", amount: p1, mode: "UPI", ref: "UPI/2610/55120" },
                { date: "12-Oct-2026", amount: p2, mode: "Cash", ref: "Cash Slip #91" }
              ];
            } else {
              payments = [
                { date: "05-Oct-2026", amount: paidSoFar, mode: "UPI", ref: "UPI/2610/55120" }
              ];
            }
          }
        } else if (isPenultimate && currentOs > rent) {
          const prevOs = currentOs - rent;
          if (prevOs >= rent) {
            payments = [];
          } else {
            const paidSoFar = rent - prevOs;
            payments = [
              { date: "05-Sep-2026", amount: paidSoFar, mode: "UPI", ref: "UPI/2609/44012" }
            ];
          }
        } else {
          payments = [
            { date: c.payDate, amount: rent, mode: "UPI", ref: c.ref }
          ];
        }
      } else {
        // Settled cycles: demonstrate 2 dates for Jul 2026, 3 dates for May 2026
        if (c.cycle === "Jul 2026") {
          const p1 = Math.round(rent * 0.6);
          const p2 = rent - p1;
          payments = [
            { date: "02-Jul-2026", amount: p1, mode: "UPI", ref: "UPI/2607/11029" },
            { date: "10-Jul-2026", amount: p2, mode: "Cash", ref: "Cash Slip #18" }
          ];
        } else if (c.cycle === "May 2026") {
          const p1 = Math.round(rent * 0.4);
          const p2 = Math.round(rent * 0.35);
          const p3 = rent - p1 - p2;
          payments = [
            { date: "04-May-2026", amount: p1, mode: "UPI", ref: "UPI/2605/88219" },
            { date: "12-May-2026", amount: p2, mode: "Cash", ref: "Cash Slip #12" },
            { date: "18-May-2026", amount: p3, mode: "NetBanking", ref: "IMPS/5521" }
          ];
        } else {
          payments = [
            { date: c.payDate, amount: rent, mode: "UPI", ref: c.ref }
          ];
        }
      }
    }

    const receivedAmount = payments.reduce((acc, p) => acc + (Number(p.amount) || 0), 0);
    let status = "Paid";
    if (receivedAmount >= dueAmount) {
      status = "Paid";
    } else if (receivedAmount > 0) {
      status = "Partial";
    } else {
      status = "Overdue";
    }

    let receivedDate = "Unpaid / Pending";
    if (payments.length === 1) {
      receivedDate = payments[0].date;
    } else if (payments.length > 1) {
      receivedDate = payments.map((p) => p.date).join(", ");
    }

    let paymentMode = "Payment Awaited";
    if (payments.length === 1) {
      paymentMode = `${payments[0].mode || "UPI"} (${payments[0].ref || c.ref})`;
    } else if (payments.length > 1) {
      paymentMode = `${payments.length} Parts (${payments.map((p) => p.mode || "UPI").join(", ")})`;
    }

    // Formula: Running Balance = Previous Running Balance + Due Amount - Received Amount
    runningBal = runningBal + dueAmount - receivedAmount;
    totalBilled += dueAmount;
    totalReceived += receivedAmount;

    rows.push({
      cycle: c.cycle,
      dueDate: c.dueDate,
      dueAmount,
      receivedDate,
      receivedAmount,
      runningBalance: runningBal,
      paymentMode,
      status,
      payments,
      tenantId: tenant.id
    });
  });

  return {
    prop,
    tenant,
    isVacant: false,
    totalBilled,
    totalReceived,
    currentBalance: runningBal,
    rows
  };
}
