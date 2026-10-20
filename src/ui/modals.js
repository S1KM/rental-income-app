/**
 * Modal Controllers & Presentation Logic
 * Handles Cloud Sync, Property Ledger, Partial Rent Payment, Track Record, Rent Receipts, and KPI Drilldown
 */

import { formatINR, formatLedgerDate, parseLedgerDateToIso, escapeHtml, numberToWords, formatDateReadable } from '../utils/formatters.js';
import { generatePropertyLedgerData } from '../utils/ledgerMath.js';
import { store } from '../state/store.js';
import { toast } from './toast.js';
import {
  STORAGE_KEY_SUPABASE_URL,
  STORAGE_KEY_SUPABASE_KEY,
  STORAGE_KEY_SUPABASE_AUTOSYNC
} from '../config/constants.js';

let activeTrackRecordTenantId = null;

// =========================================================
// 1. SUPABASE CLOUD SYNC MODAL
// =========================================================
export function openSupabaseModal() {
  const modal = document.getElementById("supabaseSyncModal");
  if (!modal) return;
  const urlInput = document.getElementById("supabaseUrlInput");
  const keyInput = document.getElementById("supabaseKeyInput");
  const autoSyncToggle = document.getElementById("supabaseAutoSyncToggle");

  if (urlInput) urlInput.value = localStorage.getItem(STORAGE_KEY_SUPABASE_URL) || "";
  if (keyInput) keyInput.value = localStorage.getItem(STORAGE_KEY_SUPABASE_KEY) || "";
  if (autoSyncToggle) autoSyncToggle.checked = localStorage.getItem(STORAGE_KEY_SUPABASE_AUTOSYNC) === "true";

  const fb = document.getElementById("supabaseFeedback");
  if (fb) fb.classList.add("hidden");

  modal.classList.remove("hidden");
}

export function closeSupabaseModal() {
  const modal = document.getElementById("supabaseSyncModal");
  if (modal) modal.classList.add("hidden");
}

// =========================================================
// 2. TENANT TRACK RECORD MODAL
// =========================================================
export function openTenantTrackRecordModal(tenantId) {
  const state = store.getState();
  const tenant = state.tenants.find((t) => t.id === tenantId);
  if (!tenant) return;

  activeTrackRecordTenantId = tenantId;
  const modal = document.getElementById("tenantTrackRecordModal");
  if (!modal) return;

  const prop = state.properties.find(
    (p) => (p.name || "").trim().toLowerCase() === (tenant.unit || "").trim().toLowerCase()
  );

  const nameEl = document.getElementById("modalTrTenantName");
  if (nameEl) nameEl.textContent = tenant.name;
  const unitEl = document.getElementById("modalTrUnitName");
  if (unitEl) unitEl.textContent = tenant.unit || "Unassigned Unit";
  const mobileEl = document.getElementById("modalTrMobile");
  if (mobileEl) mobileEl.textContent = tenant.mobile || "N/A";
  const rentEl = document.getElementById("modalTrRent");
  if (rentEl) rentEl.textContent = `${formatINR(tenant.rent)}/mo`;

  const duesBadge = document.getElementById("modalTrDuesStatus");
  if (duesBadge) {
    const os = Number(tenant.osAmount) || 0;
    if (os === 0) {
      duesBadge.className = "px-3 py-1 rounded-full text-xs font-black bg-emerald-100 text-emerald-800 border border-emerald-300 inline-flex items-center gap-1.5 shadow-2xs";
      duesBadge.innerHTML = `<span class="w-2 h-2 rounded-full bg-emerald-500"></span>✓ All Dues Clear (₹0)`;
    } else {
      duesBadge.className = "px-3 py-1 rounded-full text-xs font-black bg-rose-100 text-rose-800 border border-rose-300 inline-flex items-center gap-1.5 shadow-2xs";
      duesBadge.innerHTML = `<span class="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span>⚠️ Outstanding: ${formatINR(os)}`;
    }
  }

  // Generate 7-Month Running Balance Ledger Table
  const propId = prop ? prop.id : state.properties[0]?.id;
  const ledgerData = generatePropertyLedgerData(propId, tenant, state);
  const ledgerBody = document.getElementById("modalTrLedgerBody");

  if (ledgerBody && ledgerData && ledgerData.rows) {
    ledgerBody.innerHTML = "";
    ledgerData.rows.forEach((r) => {
      const isPaid = r.status === "Paid";
      const isPartial = r.status === "Partial";
      const isOverdue = r.status === "Overdue";

      let paymentReceivedHtml = "";
      if (r.payments && r.payments.length > 0) {
        paymentReceivedHtml = `
          <div class="flex flex-col gap-1 py-0.5 whitespace-nowrap">
            ${r.payments.map((p, pIdx) => `
              <button
                type="button"
                data-action="open-partial-pay"
                data-prop-id="${prop ? prop.id : ""}"
                data-cycle="${escapeHtml(r.cycle)}"
                data-installment-index="${pIdx}"
                class="inline-flex items-center gap-1.5 text-[11px] font-mono text-emerald-800 hover:text-emerald-950 whitespace-nowrap bg-emerald-50/80 hover:bg-emerald-100 px-2 py-0.5 rounded border border-emerald-200/80 cursor-pointer text-left transition"
                title="Click to update payment received on ${p.date}"
              >
                <span class="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0"></span>
                <span class="font-bold text-slate-700 whitespace-nowrap">${r.payments.length > 1 ? `Part ${pIdx + 1}:` : "Paid:"}</span>
                <span class="whitespace-nowrap font-medium text-emerald-950 underline decoration-emerald-300 underline-offset-2">${p.date}</span>
                <span class="text-slate-400">·</span>
                <span class="font-bold text-emerald-700 whitespace-nowrap">${formatINR(p.amount)}</span>
              </button>
            `).join("")}
          </div>
        `;
      } else {
        paymentReceivedHtml = `
          <button
            type="button"
            data-action="open-partial-pay"
            data-prop-id="${prop ? prop.id : ""}"
            data-cycle="${escapeHtml(r.cycle)}"
            class="text-[11px] font-mono font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 px-2 py-0.5 rounded border border-rose-200 inline-flex items-center gap-1 cursor-pointer transition whitespace-nowrap"
            title="Click to record payment"
          >
            <span class="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse shrink-0"></span> Unpaid · Record Pay
          </button>
        `;
      }

      const row = document.createElement("tr");
      row.className = "hover:bg-slate-50/80 transition-colors whitespace-nowrap text-xs";
      row.innerHTML = `
        <td class="py-2.5 px-3 font-extrabold text-slate-900 whitespace-nowrap">
          <button
            type="button"
            data-action="open-partial-pay"
            data-prop-id="${prop ? prop.id : ""}"
            data-cycle="${escapeHtml(r.cycle)}"
            class="hover:text-indigo-600 font-extrabold text-slate-900 inline-flex items-center gap-1.5 whitespace-nowrap cursor-pointer text-left transition"
            title="Click to record payment received for ${escapeHtml(r.cycle)}"
          >
            <span class="text-xs">🗓️</span>
            <span class="underline decoration-indigo-200 hover:decoration-indigo-600 underline-offset-2">${escapeHtml(r.cycle)}</span>
          </button>
        </td>
        <td class="py-2.5 px-3 whitespace-nowrap">
          <button
            type="button"
            data-action="open-partial-pay"
            data-prop-id="${prop ? prop.id : ""}"
            data-cycle="${escapeHtml(r.cycle)}"
            class="font-mono text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-800 hover:border-indigo-300 px-2 py-0.5 rounded border border-slate-200 whitespace-nowrap transition cursor-pointer text-left"
            title="Click to record payment received for ${escapeHtml(r.cycle)}"
          >
            ${r.dueDate}
          </button>
        </td>
        <td class="py-2.5 px-3 text-right font-black font-mono text-slate-900 whitespace-nowrap">${formatINR(r.dueAmount)}</td>
        <td class="py-2.5 px-3 font-mono text-xs whitespace-nowrap">
          ${paymentReceivedHtml}
        </td>
        <td class="py-2.5 px-3 text-right font-black font-mono whitespace-nowrap ${isPaid ? "text-emerald-700" : (isPartial ? "text-amber-700" : "text-slate-400")}">
          ${formatINR(r.receivedAmount)}
        </td>
        <td class="py-2.5 px-3 text-right whitespace-nowrap">
          ${
            r.runningBalance > 0
              ? `<span class="inline-flex items-center gap-1 font-mono font-black text-rose-700 text-xs bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200 whitespace-nowrap shadow-2xs">
                   <span class="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse shrink-0"></span>
                   <span>${formatINR(r.runningBalance)} Due</span>
                 </span>`
              : (r.runningBalance < 0
                  ? `<span class="inline-flex items-center gap-1 font-mono font-black text-emerald-700 text-xs bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 whitespace-nowrap shadow-2xs">
                       <span>+${formatINR(Math.abs(r.runningBalance))} Advance</span>
                     </span>`
                  : `<span class="inline-flex items-center gap-1 font-mono font-bold text-slate-700 text-xs whitespace-nowrap">
                       <span class="text-emerald-600 font-bold">✓</span> ₹0 Clear
                     </span>`)
          }
        </td>
        <td class="py-2.5 px-3 whitespace-nowrap">
          ${
            isPaid
              ? `<span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-300 shadow-2xs whitespace-nowrap">
                  <span class="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0"></span> Settled
                 </span>`
              : (isPartial
                  ? `<span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-100 text-amber-900 border border-amber-300 shadow-2xs whitespace-nowrap">
                      <span class="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0"></span> Partial
                     </span>`
                  : `<span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-100 text-rose-800 border border-rose-300 shadow-2xs whitespace-nowrap">
                      <span class="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse shrink-0"></span> Overdue
                     </span>`)
          }
        </td>
        <td class="py-2.5 px-3 text-right whitespace-nowrap">
          <button
            type="button"
            data-action="open-receipt"
            data-id="${tenant.id}"
            class="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-[11px] transition shadow-2xs border border-indigo-200 whitespace-nowrap"
          >
            🧾 Receipt
          </button>
        </td>
      `;
      ledgerBody.appendChild(row);
    });
  }

  modal.classList.remove("hidden");
}

export function closeTenantTrackRecordModal() {
  const modal = document.getElementById("tenantTrackRecordModal");
  if (modal) modal.classList.add("hidden");
}

// =========================================================
// 3. PROPERTY LEDGER MODAL
// =========================================================
export function openPropertyLedgerModal(propertyId) {
  const state = store.getState();
  state.activeLedgerPropId = propertyId;
  const modal = document.getElementById("propertyLedgerModal");
  if (!modal) return;
  modal.classList.remove("hidden");
  renderPropertyLedgerModalContent(propertyId);
}

export function closePropertyLedgerModal() {
  const modal = document.getElementById("propertyLedgerModal");
  if (modal) modal.classList.add("hidden");
}

export function renderPropertyLedgerModalContent(propertyId) {
  const state = store.getState();
  const ledgerData = generatePropertyLedgerData(propertyId, null, state);
  if (!ledgerData) return;

  const { prop, tenant, isVacant, totalBilled, totalReceived, currentBalance, rows } = ledgerData;

  const titleEl = document.getElementById("modalPropLedgerTitle");
  if (titleEl) titleEl.textContent = `${prop.name} — Full Rent Roll Statement`;
  const subEl = document.getElementById("modalPropLedgerSubtitle");
  if (subEl) subEl.textContent = `${prop.building || "Sagarpur"} · ${prop.type || "Residential Unit"} · Monthly Rent: ${formatINR(prop.rent)}`;

  const billedEl = document.getElementById("modalPropBilledStat");
  if (billedEl) billedEl.textContent = formatINR(totalBilled);
  const recvEl = document.getElementById("modalPropRecvStat");
  if (recvEl) recvEl.textContent = formatINR(totalReceived);
  const balEl = document.getElementById("modalPropBalanceStat");
  if (balEl) {
    balEl.textContent = formatINR(currentBalance);
    balEl.className = currentBalance > 0 ? "text-xl sm:text-2xl font-black text-rose-600 mt-0.5" : "text-xl sm:text-2xl font-black text-emerald-700 mt-0.5";
  }

  const tbody = document.getElementById("modalPropLedgerTableBody");
  if (tbody) {
    tbody.innerHTML = "";
    rows.forEach((r, idx) => {
      const isPaid = r.status === "Paid";
      const isPartial = r.status === "Partial";
      const isOverdue = r.status === "Overdue";

      let installmentPillsHtml = "";
      if (r.payments && r.payments.length > 0) {
        installmentPillsHtml = `
          <div class="flex flex-col gap-1 py-1">
            ${r.payments.map((p, pIdx) => `
              <div class="inline-flex items-center gap-1.5 text-[11px] font-mono text-emerald-900 bg-emerald-50/90 px-2 py-0.5 rounded border border-emerald-200/90 shadow-2xs whitespace-nowrap">
                <span class="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0"></span>
                <span class="font-bold text-slate-700">${r.payments.length > 1 ? `Part ${pIdx + 1}:` : "Paid:"}</span>
                <span class="font-bold text-emerald-950">${p.date}</span>
                <span class="text-slate-400">·</span>
                <span class="font-black text-emerald-700">${formatINR(p.amount)}</span>
                <span class="text-slate-400">·</span>
                <span class="text-[10px] text-slate-500 bg-white px-1.5 py-0.2 rounded border border-slate-200">${p.mode || "UPI"}</span>
              </div>
            `).join("")}
            ${isPartial ? `<div class="text-[10px] font-bold text-amber-700 pl-1">⏳ Pending: ${formatINR(r.dueAmount - r.receivedAmount)} Due</div>` : ""}
          </div>
        `;
      } else {
        installmentPillsHtml = `
          <span class="inline-flex items-center gap-1.5 text-[11px] font-mono font-bold text-rose-700 bg-rose-50 px-2.5 py-1 rounded border border-rose-200 shadow-2xs">
            <span class="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse"></span>
            No payment received
          </span>
        `;
      }

      const tr = document.createElement("tr");
      tr.className = "hover:bg-slate-50/80 transition-colors whitespace-nowrap text-xs";
      tr.innerHTML = `
        <td class="py-3 px-3 font-mono font-bold text-slate-500 text-center whitespace-nowrap">${idx + 1}</td>
        <td class="py-3 px-3 font-black text-slate-900 whitespace-nowrap">
          <span class="text-xs">🗓️</span> ${escapeHtml(r.cycle)}
        </td>
        <td class="py-3 px-3 font-mono font-semibold text-slate-700 whitespace-nowrap">${r.dueDate}</td>
        <td class="py-3 px-3 text-right font-mono font-black text-slate-900 whitespace-nowrap">${formatINR(r.dueAmount)}</td>
        <td class="py-3 px-3 whitespace-nowrap font-mono text-xs">
          ${installmentPillsHtml}
        </td>
        <td class="py-3 px-3 text-right font-mono font-black whitespace-nowrap text-sm ${isPaid ? "text-emerald-700" : (isPartial ? "text-amber-700" : "text-slate-400")}">
          ${formatINR(r.receivedAmount)}
        </td>
        <td class="py-3 px-3 text-right whitespace-nowrap">
          ${
            r.runningBalance > 0
              ? `<span class="inline-flex items-center gap-1 font-mono font-black text-rose-700 text-sm bg-rose-50 px-2.5 py-0.5 rounded-md border border-rose-200 whitespace-nowrap shadow-2xs">
                   <span class="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse shrink-0"></span>
                   <span>${formatINR(r.runningBalance)} Due</span>
                 </span>`
              : (r.runningBalance < 0
                  ? `<span class="inline-flex items-center gap-1 font-mono font-black text-emerald-700 text-sm bg-emerald-50 px-2.5 py-0.5 rounded-md border border-emerald-200 whitespace-nowrap shadow-2xs">
                       <span>+${formatINR(Math.abs(r.runningBalance))} Advance</span>
                     </span>`
                  : `<span class="inline-flex items-center gap-1 font-mono font-black text-slate-800 text-sm whitespace-nowrap">
                       <span class="text-emerald-600 font-bold text-xs">✓</span> ₹0 Clear
                     </span>`)
          }
        </td>
        <td class="py-3 px-3 whitespace-nowrap">
          <span class="inline-flex items-center gap-1.5 text-[11px] font-mono text-slate-700 bg-slate-50 px-2 py-0.5 rounded border border-slate-200 shadow-2xs whitespace-nowrap">
            <span class="font-bold text-indigo-700">${escapeHtml(r.payments && r.payments.length > 1 ? `${r.payments.length} Parts` : (r.payments && r.payments[0] ? r.payments[0].mode : "UPI"))}</span>
            <span>${escapeHtml(r.paymentMode.replace("UPI (", "").replace(")", ""))}</span>
          </span>
        </td>
        <td class="py-3 px-3 text-center whitespace-nowrap">
          <span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold shadow-2xs whitespace-nowrap ${
            isOverdue
              ? "bg-rose-100 text-rose-800 border border-rose-300"
              : (isPartial ? "bg-amber-100 text-amber-900 border border-amber-300" : "bg-emerald-100 text-emerald-800 border border-emerald-300")
          }">
            <span class="w-1.5 h-1.5 rounded-full shrink-0 ${isOverdue ? "bg-rose-600 animate-pulse" : (isPartial ? "bg-amber-600" : "bg-emerald-600")}"></span>
            ${isOverdue ? "Overdue" : (isPartial ? "Partially Received" : (r.payments && r.payments.length > 1 ? `Received (${r.payments.length} Parts)` : "Received"))}
          </span>
        </td>
        <td class="py-3 px-3 text-center whitespace-nowrap">
          <div class="inline-flex items-center gap-1.5 whitespace-nowrap">
            <button
              type="button"
              data-action="open-partial-pay"
              data-prop-id="${prop.id}"
              data-cycle="${escapeHtml(r.cycle)}"
              class="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg ${
                isOverdue
                  ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                  : (isPartial ? "bg-amber-600 hover:bg-amber-700 text-white" : "bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200")
              } font-bold text-[11px] transition shadow-2xs whitespace-nowrap"
              title="Record full or partial rent payment for ${escapeHtml(r.cycle)}"
            >
              <span>+</span> ${isOverdue ? "Record Pay" : (isPartial ? "Partial Pay" : "Installment")}
            </button>
            ${
              !isOverdue
                ? `<button
                    type="button"
                    data-action="open-receipt"
                    data-id="${tenant ? tenant.id : ""}"
                    class="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[11px] transition shadow-2xs border border-slate-200 whitespace-nowrap"
                    title="View official rent receipt"
                  >
                    <span>🧾</span> Receipt
                  </button>`
                : `<button
                    type="button"
                    data-action="modal-settle-balance"
                    data-prop-id="${prop.id}"
                    class="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-600 text-white font-bold text-[11px] transition shadow-2xs whitespace-nowrap"
                    title="Clear and settle this overdue cycle"
                  >
                    <span>✓</span> Settle
                  </button>`
            }
          </div>
        </td>
      `;
      tbody.appendChild(tr);
    });
  }

  // Populate Reconciliation Footer
  const tfoot = document.getElementById("modalPropLedgerTableFoot");
  if (tfoot) {
    tfoot.innerHTML = `
      <tr class="whitespace-nowrap">
        <td colspan="3" class="py-3.5 px-3 text-right font-black uppercase tracking-wider text-slate-700 whitespace-nowrap">
          Reconciled Totals:
        </td>
        <td class="py-3.5 px-3 text-right font-mono font-black text-indigo-950 text-sm whitespace-nowrap">
          ${formatINR(totalBilled)}
        </td>
        <td class="py-3.5 px-3 text-right font-bold text-slate-500 whitespace-nowrap">
          Collected:
        </td>
        <td class="py-3.5 px-3 text-right font-mono font-black text-emerald-700 text-sm whitespace-nowrap">
          ${formatINR(totalReceived)}
        </td>
        <td class="py-3.5 px-3 text-right font-mono font-black text-sm whitespace-nowrap ${currentBalance > 0 ? "text-rose-700 bg-rose-50/80" : "text-slate-900"}">
          ${formatINR(currentBalance)}
        </td>
        <td colspan="3" class="py-3.5 px-3 text-center whitespace-nowrap">
          <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-extrabold whitespace-nowrap ${currentBalance === 0 ? "bg-emerald-100 text-emerald-800 border border-emerald-300" : "bg-rose-100 text-rose-800 border border-rose-300"} shadow-2xs">
            <span class="w-1.5 h-1.5 rounded-full shrink-0 ${currentBalance === 0 ? "bg-emerald-600" : "bg-rose-600 animate-pulse"}"></span>
            ${currentBalance === 0 ? "✓ 100% Balanced & Settled" : "⚠️ Outstanding Balance Unpaid"}
          </span>
        </td>
      </tr>
    `;
  }
}

export function settlePropertyLedgerBalance(propertyId) {
  const state = store.getState();
  const prop = state.properties.find((p) => p.id === propertyId);
  if (!prop) return;
  const tenant = state.tenants.find(
    (t) => t.status !== "Vacated" && (t.unit || "").trim().toLowerCase() === (prop.name || "").trim().toLowerCase()
  );
  if (!tenant) return;

  const clearedAmt = Number(tenant.osAmount) || 0;
  tenant.osAmount = 0;

  const dateStr = formatLedgerDate(new Date()) || "05-Oct-2026";
  const cycle = "Oct 2026";
  const instKey = prop.id + "_" + cycle;
  const rent = Number(tenant.rent) || 12000;
  if (!state.ledgerInstallments) state.ledgerInstallments = {};
  state.ledgerInstallments[instKey] = [
    { date: dateStr, amount: rent, mode: "UPI", ref: "UPI/SETTLE/" + Date.now().toString().slice(-5) }
  ];

  store.save();
  store.notify("render_all");
  renderPropertyLedgerModalContent(prop.id);
  toast.success(`Outstanding balance of ${formatINR(clearedAmt)} for "${prop.name}" settled in full!`, "Balance Settled");
}

// =========================================================
// 4. PARTIAL PAYMENT & INSTALLMENT MODAL
// =========================================================
export function openPartialPaymentModal(propertyId, targetCycle = null, editIndex = null) {
  const state = store.getState();
  state.activePartialPayPropId = propertyId;
  state.activePartialPayCycle = targetCycle;
  state.editingInstallmentIndex = (editIndex !== null && editIndex !== undefined) ? Number(editIndex) : null;

  const prop = state.properties.find((p) => p.id === propertyId);
  if (!prop) return;

  const tenant = state.tenants.find(
    (t) => t.status !== "Vacated" && (t.unit || "").trim().toLowerCase() === (prop.name || "").trim().toLowerCase()
  );

  const titleEl = document.getElementById("partialPayUnitTitle");
  if (titleEl) titleEl.textContent = `${prop.name} — ${tenant ? tenant.name : "Vacant Property"}`;
  const subEl = document.getElementById("partialPaySubtitle");
  if (subEl) subEl.textContent = `${prop.building || "Sagarpur"} · Monthly Rent: ${formatINR(tenant ? tenant.rent : prop.rent)}`;

  // Populate Target Billing Cycle dropdown with UNSETTLED cycles only
  const cycleSelect = document.getElementById("partialPayCycleSelect");
  if (cycleSelect) {
    cycleSelect.innerHTML = "";
    const ledger = generatePropertyLedgerData(propertyId, tenant, state);
    if (ledger && ledger.rows) {
      let filteredRows = ledger.rows.filter(r => r.status === "Partial" || r.status === "Overdue" || (Number(r.dueAmount) - Number(r.receivedAmount) > 0));

      if (targetCycle && !filteredRows.some(r => r.cycle === targetCycle)) {
        const explicitRow = ledger.rows.find(r => r.cycle === targetCycle);
        if (explicitRow) filteredRows.push(explicitRow);
      }

      if (filteredRows.length === 0) {
        const opt = document.createElement("option");
        opt.value = "";
        opt.textContent = "All billing cycles settled ✓ (No unsettled rent)";
        opt.disabled = true;
        opt.selected = true;
        cycleSelect.appendChild(opt);
      } else {
        filteredRows.forEach((r) => {
          const opt = document.createElement("option");
          opt.value = r.cycle;
          const pending = Math.max(0, Number(r.dueAmount) - Number(r.receivedAmount));
          opt.textContent = `${r.cycle} — Pending: ${formatINR(pending)} (Due: ${formatINR(r.dueAmount)} · Recv: ${formatINR(r.receivedAmount)}) [${r.status}]`;
          if (targetCycle && r.cycle === targetCycle) {
            opt.selected = true;
          }
          cycleSelect.appendChild(opt);
        });

        if (!targetCycle && cycleSelect.options.length > 0) {
          cycleSelect.selectedIndex = 0;
          state.activePartialPayCycle = cycleSelect.value;
        }
      }
    }
  }

  updatePartialPayModalFinancials(false);

  const modal = document.getElementById("recordPartialPaymentModal");
  if (modal) modal.classList.remove("hidden");
}

export function closePartialPaymentModal() {
  const modal = document.getElementById("recordPartialPaymentModal");
  if (modal) modal.classList.add("hidden");
  const state = store.getState();
  state.editingInstallmentIndex = null;
}

export function updatePartialPayModalFinancials(resetInputs = true) {
  const state = store.getState();
  const propId = state.activePartialPayPropId;
  const cycleSelect = document.getElementById("partialPayCycleSelect");
  const selectedCycle = cycleSelect ? cycleSelect.value : state.activePartialPayCycle;
  if (!propId || !selectedCycle) return;

  const ledger = generatePropertyLedgerData(propId, null, state);
  const row = ledger?.rows?.find((r) => r.cycle === selectedCycle);
  if (!row) return;

  const dueEl = document.getElementById("partialPayRentDue");
  if (dueEl) dueEl.textContent = formatINR(row.dueAmount);
  const recvEl = document.getElementById("partialPayAlreadyReceived");
  if (recvEl) recvEl.textContent = formatINR(row.receivedAmount);
  const remEl = document.getElementById("partialPayRemainingDue");
  const remaining = Math.max(0, row.dueAmount - row.receivedAmount);
  if (remEl) {
    remEl.textContent = formatINR(remaining);
    remEl.className = remaining > 0 ? "font-mono font-black text-rose-600" : "font-mono font-black text-emerald-700";
  }

  // Edit vs Add Installment Mode Form
  const isEditing = state.editingInstallmentIndex !== null && row.payments && row.payments[state.editingInstallmentIndex];
  const editBanner = document.getElementById("partialPayEditBanner");
  const formTitle = document.getElementById("partialPayFormTitle");
  const submitBtn = document.getElementById("submitPartialPayBtn");
  const submitText = document.getElementById("submitPartialPayBtnText");
  const amountInput = document.getElementById("partialPayAmountInput");
  const dateInput = document.getElementById("partialPayDateInput");
  const modeSelect = document.getElementById("partialPayModeSelect");
  const refInput = document.getElementById("partialPayRefInput");

  if (isEditing) {
    const p = row.payments[state.editingInstallmentIndex];
    if (editBanner) editBanner.classList.remove("hidden");
    if (formTitle) formTitle.textContent = `Update Existing Payment (${p.date} · ${formatINR(p.amount)})`;
    if (submitBtn) {
      submitBtn.className = "w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs transition shadow-md flex items-center justify-center gap-2 cursor-pointer active:scale-98";
    }
    if (submitText) submitText.textContent = "Save Updated Payment Entry";

    if (resetInputs) {
      if (amountInput) amountInput.value = p.amount;
      if (dateInput) dateInput.value = parseLedgerDateToIso(p.date);
      if (modeSelect) modeSelect.value = p.mode || "UPI";
      if (refInput) refInput.value = p.ref || "";
    }
  } else {
    if (editBanner) editBanner.classList.add("hidden");
    if (formTitle) formTitle.textContent = "Record New Installment Received";
    if (submitBtn) {
      submitBtn.className = "w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs transition shadow-md flex items-center justify-center gap-2 cursor-pointer active:scale-98";
    }
    if (submitText) submitText.textContent = "Record Payment Installment";

    if (resetInputs) {
      if (amountInput) amountInput.value = remaining > 0 ? remaining : row.dueAmount;
      if (dateInput) {
        const today = new Date().toISOString().slice(0, 10);
        dateInput.value = today;
      }
      if (modeSelect) modeSelect.value = "UPI";
      if (refInput) refInput.value = "";
    }
  }

  // Populate Existing Installments Section
  const existingSection = document.getElementById("partialPayExistingSection");
  const existingList = document.getElementById("partialPayExistingList");
  if (existingSection && existingList) {
    if (row.payments && row.payments.length > 0) {
      existingSection.classList.remove("hidden");
      existingList.innerHTML = row.payments.map((p, idx) => {
        const isSelected = isEditing && state.editingInstallmentIndex === idx;
        return `
          <div class="flex items-center justify-between p-2.5 rounded-xl ${isSelected ? "bg-indigo-50 border-2 border-indigo-500" : "bg-white border border-slate-200"} text-xs shadow-2xs">
            <div class="flex items-center gap-2">
              <span class="w-2 h-2 rounded-full ${isSelected ? "bg-indigo-600" : "bg-emerald-500"}"></span>
              <div>
                <span class="font-bold text-slate-800">Part ${idx + 1}: ${p.date}</span>
                <span class="text-slate-400">·</span>
                <span class="font-mono font-black text-emerald-700">${formatINR(p.amount)}</span>
                <span class="text-slate-400">·</span>
                <span class="text-[10px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">${escapeHtml(p.mode || "UPI")} (${escapeHtml(p.ref || "Ref")})</span>
              </div>
            </div>
            <div class="inline-flex items-center gap-1 shrink-0">
              <button
                type="button"
                data-action="edit-installment"
                data-prop-id="${propId}"
                data-cycle="${escapeHtml(selectedCycle)}"
                data-index="${idx}"
                class="px-2.5 py-1 rounded-lg ${isSelected ? "bg-indigo-600 text-white" : "bg-indigo-50 hover:bg-indigo-100 text-indigo-700"} font-bold text-[11px] transition flex items-center gap-1 cursor-pointer shadow-2xs"
                title="Update this payment entry"
              >
                ✏️ ${isSelected ? "Editing" : "Update"}
              </button>
              <button
                type="button"
                data-action="remove-installment"
                data-prop-id="${propId}"
                data-cycle="${escapeHtml(selectedCycle)}"
                data-index="${idx}"
                class="text-slate-400 hover:text-rose-600 font-bold px-1.5 py-1 rounded hover:bg-rose-50 transition cursor-pointer"
                title="Remove this installment entry"
              >
                ✕
              </button>
            </div>
          </div>
        `;
      }).join("");
    } else {
      existingSection.classList.add("hidden");
      existingList.innerHTML = "";
    }
  }
}

export function editInstallment(propId, cycle, index) {
  const state = store.getState();
  state.activePartialPayPropId = propId;
  state.activePartialPayCycle = cycle;
  state.editingInstallmentIndex = index;
  updatePartialPayModalFinancials(true);
}

export function setAddInstallmentMode() {
  const state = store.getState();
  state.editingInstallmentIndex = null;
  updatePartialPayModalFinancials(true);
}

export function cancelEditInstallment() {
  setAddInstallmentMode();
}

export function submitPartialPayment() {
  const state = store.getState();
  const propId = state.activePartialPayPropId;
  const cycleSelect = document.getElementById("partialPayCycleSelect");
  const cycle = cycleSelect ? cycleSelect.value : state.activePartialPayCycle;
  const dateInput = document.getElementById("partialPayDateInput");
  const amountInput = document.getElementById("partialPayAmountInput");
  const modeSelect = document.getElementById("partialPayModeSelect");
  const refInput = document.getElementById("partialPayRefInput");

  if (!propId || !cycle) {
    toast.error("No unsettled billing cycle selected.");
    return;
  }

  const amt = Number(amountInput ? amountInput.value : 0);
  if (!amt || amt <= 0) {
    toast.error("Please enter a valid payment amount greater than ₹0.");
    if (amountInput) amountInput.focus();
    return;
  }

  const rawDate = dateInput ? dateInput.value : "";
  const formattedDate = formatLedgerDate(rawDate) || "05-Oct-2026";
  const mode = modeSelect ? modeSelect.value : "UPI";
  const ref = refInput && refInput.value.trim() ? refInput.value.trim() : `${mode}/${Date.now().toString().slice(-6)}`;

  const instKey = propId + "_" + cycle;
  if (!state.ledgerInstallments) state.ledgerInstallments = {};

  const initialLedger = generatePropertyLedgerData(propId, null, state);
  if (initialLedger && initialLedger.rows) {
    initialLedger.rows.forEach((r) => {
      const key = propId + "_" + r.cycle;
      if (!state.ledgerInstallments[key] || !Array.isArray(state.ledgerInstallments[key])) {
        state.ledgerInstallments[key] = r.payments ? JSON.parse(JSON.stringify(r.payments)) : [];
      }
    });
  }

  const isEditing = state.editingInstallmentIndex !== null && state.ledgerInstallments[instKey][state.editingInstallmentIndex];

  if (isEditing) {
    state.ledgerInstallments[instKey][state.editingInstallmentIndex] = {
      ...state.ledgerInstallments[instKey][state.editingInstallmentIndex],
      date: formattedDate,
      amount: amt,
      mode: mode,
      ref: ref
    };
  } else {
    state.ledgerInstallments[instKey].push({
      id: "inst_" + Date.now(),
      date: formattedDate,
      amount: amt,
      mode: mode,
      ref: ref
    });
  }

  const updatedLedger = generatePropertyLedgerData(propId, null, state);
  const prop = state.properties.find((p) => p.id === propId);
  const tenant = prop
    ? state.tenants.find(
        (t) => t.status !== "Vacated" && (t.unit || "").trim().toLowerCase() === (prop.name || "").trim().toLowerCase()
      )
    : null;

  if (tenant) {
    tenant.osAmount = Math.max(0, updatedLedger.currentBalance);
  }

  state.editingInstallmentIndex = null;
  store.save();
  store.notify("render_all");
  renderPropertyLedgerModalContent(propId);

  if (tenant) {
    const trModal = document.getElementById("tenantTrackRecordModal");
    if (activeTrackRecordTenantId === tenant.id || (trModal && !trModal.classList.contains("hidden"))) {
      openTenantTrackRecordModal(tenant.id);
    }
  }

  closePartialPaymentModal();
  toast.success(
    isEditing
      ? `Payment updated to ${formatINR(amt)} on ${formattedDate} (${mode})! Balance: ${formatINR(updatedLedger.currentBalance)}`
      : `Recorded payment of ${formatINR(amt)} on ${formattedDate} (${mode})!`,
    "Payment Synchronized"
  );
}

export function removeLedgerInstallment(propId, cycle, index) {
  const state = store.getState();
  const instKey = propId + "_" + cycle;
  if (!state.ledgerInstallments) state.ledgerInstallments = {};

  const initialLedger = generatePropertyLedgerData(propId, null, state);
  if (initialLedger && initialLedger.rows) {
    initialLedger.rows.forEach((r) => {
      const key = propId + "_" + r.cycle;
      if (!state.ledgerInstallments[key] || !Array.isArray(state.ledgerInstallments[key])) {
        state.ledgerInstallments[key] = r.payments ? JSON.parse(JSON.stringify(r.payments)) : [];
      }
    });
  }

  if (state.ledgerInstallments[instKey] && state.ledgerInstallments[instKey][index]) {
    const removed = state.ledgerInstallments[instKey].splice(index, 1)[0];
    const updatedLedger = generatePropertyLedgerData(propId, null, state);

    const prop = state.properties.find((p) => p.id === propId);
    const tenant = prop
      ? state.tenants.find(
          (t) => t.status !== "Vacated" && (t.unit || "").trim().toLowerCase() === (prop.name || "").trim().toLowerCase()
        )
      : null;

    if (tenant) {
      tenant.osAmount = Math.max(0, updatedLedger.currentBalance);
    }

    state.editingInstallmentIndex = null;
    store.save();
    store.notify("render_all");
    renderPropertyLedgerModalContent(propId);

    if (tenant) {
      const trModal = document.getElementById("tenantTrackRecordModal");
      if (activeTrackRecordTenantId === tenant.id || (trModal && !trModal.classList.contains("hidden"))) {
        openTenantTrackRecordModal(tenant.id);
      }
    }

    updatePartialPayModalFinancials(false);
    toast.info(`Installment of ${formatINR(removed.amount)} removed. Running balance: ${formatINR(updatedLedger.currentBalance)}`);
  }
}

// =========================================================
// 5. RENT RECEIPT MODAL
// =========================================================
export function openRentReceipt(tenantId) {
  const state = store.getState();
  const tenant = state.tenants.find((t) => t.id === tenantId);
  if (!tenant) return;

  const prop = state.properties.find(
    (p) => (p.name || "").trim().toLowerCase() === (tenant.unit || "").trim().toLowerCase()
  );

  const landlordName = state.landlord.name || "Rajesh Sharma";
  const landlordPan = state.landlord.pan || "ABCPS1234D";
  const landlordEmail = state.landlord.email || "abcltd9925@gmail.com";
  const rent = Number(tenant.rent) || (prop ? Number(prop.rent) : 12000);

  const numEl = document.getElementById("rcptNumber");
  if (numEl) numEl.textContent = `RCPT-${new Date().getFullYear()}-${String(tenant.id).replace(/\D/g, "").slice(-4) || "1001"}`;
  const dateEl = document.getElementById("rcptDate");
  if (dateEl) dateEl.textContent = new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
  const tenantNameEl = document.getElementById("rcptTenantName");
  if (tenantNameEl) tenantNameEl.textContent = tenant.name;
  const propNameEl = document.getElementById("rcptPropName");
  if (propNameEl) propNameEl.textContent = tenant.unit || (prop ? prop.name : "Residential Unit");
  const propAddrEl = document.getElementById("rcptPropAddress");
  if (propAddrEl) propAddrEl.textContent = prop?.address || "Address in Master";

  const amtEl = document.getElementById("rcptAmount");
  if (amtEl) amtEl.textContent = formatINR(rent);
  const wordsEl = document.getElementById("rcptAmountWords");
  if (wordsEl) wordsEl.textContent = numberToWords(rent);

  const lNameEl = document.getElementById("rcptLandlordName");
  if (lNameEl) lNameEl.textContent = landlordName;
  const lPanEl = document.getElementById("rcptLandlordPan");
  if (lPanEl) lPanEl.textContent = landlordPan;
  const lEmailEl = document.getElementById("rcptLandlordEmail");
  if (lEmailEl) lEmailEl.textContent = landlordEmail;

  const signLNameEl = document.getElementById("rcptSignLandlordName");
  if (signLNameEl) signLNameEl.textContent = landlordName;

  const modal = document.getElementById("rentReceiptModal");
  if (modal) modal.classList.remove("hidden");
}

export function closeRentReceipt() {
  const modal = document.getElementById("rentReceiptModal");
  if (modal) modal.classList.add("hidden");
}

// =========================================================
// 6. LINK TENANT MODAL
// =========================================================
export function openLinkTenantModal(propId) {
  const state = store.getState();
  const prop = state.properties.find((p) => p.id === propId);
  if (!prop) return;

  const titleEl = document.getElementById("linkModalPropName");
  if (titleEl) titleEl.textContent = prop.name;
  const subEl = document.getElementById("linkModalPropDetails");
  if (subEl) subEl.textContent = `${prop.building || "Sagarpur"} · Default Rent: ${formatINR(prop.rent)}`;
  const rentInput = document.getElementById("linkAgreedRentInput");
  if (rentInput) rentInput.value = prop.rent;

  const hiddenId = document.getElementById("linkModalPropId");
  if (hiddenId) hiddenId.value = propId;

  // Populate Unassigned/Vacated Tenants Dropdown
  const select = document.getElementById("linkTenantSelect");
  if (select) {
    select.innerHTML = '<option value="">-- Choose Tenant from Pool --</option>';
    const available = state.tenants.filter(t => t.status === "Vacated" || !t.unit || (t.unit || "").toLowerCase().includes("unassigned"));
    available.forEach(t => {
      const opt = document.createElement("option");
      opt.value = t.id;
      opt.textContent = `${t.name} (Mobile: ${t.mobile || "N/A"})`;
      select.appendChild(opt);
    });
  }

  const modal = document.getElementById("linkTenantModal");
  if (modal) modal.classList.remove("hidden");
}

export function closeLinkTenantModal() {
  const modal = document.getElementById("linkTenantModal");
  if (modal) modal.classList.add("hidden");
}

// =========================================================
// 7. KPI DETAIL MODAL
// =========================================================
export function openKpiDetailModal(kpiType) {
  const state = store.getState();
  state.activeKpiTab = kpiType;
  const modal = document.getElementById("kpiDetailModal");
  if (!modal) return;
  modal.classList.remove("hidden");
  renderKpiDetailContent(kpiType);
}

export function closeKpiDetailModal() {
  const modal = document.getElementById("kpiDetailModal");
  if (modal) modal.classList.add("hidden");
}

export function renderKpiDetailContent(kpiType) {
  const state = store.getState();
  const container = document.getElementById("kpiDetailContentContainer");
  if (!container) return;

  const totalProps = state.properties.length;
  const occupiedProps = state.properties.filter((p) =>
    state.tenants.some((t) => t.status !== "Vacated" && (t.unit || "").trim().toLowerCase() === (p.name || "").trim().toLowerCase())
  );
  const vacantProps = state.properties.filter((p) =>
    !state.tenants.some((t) => t.status !== "Vacated" && (t.unit || "").trim().toLowerCase() === (p.name || "").trim().toLowerCase())
  );

  const totalExpected = state.tenants
    .filter((t) => t.status !== "Vacated")
    .reduce((sum, t) => sum + (Number(t.rent) || 0), 0);
  const totalOverdue = state.tenants
    .filter((t) => t.status !== "Vacated")
    .reduce((sum, t) => sum + (Number(t.osAmount) || 0), 0);
  const totalRealized = Math.max(0, totalExpected - totalOverdue);

  if (kpiType === "occupancy") {
    container.innerHTML = `
      <div class="space-y-4">
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div class="bg-indigo-50/70 p-3.5 rounded-2xl border border-indigo-200">
            <span class="text-[11px] font-bold text-indigo-900 uppercase">Portfolio Size</span>
            <p class="text-xl font-black text-indigo-950 mt-1">${totalProps} Units</p>
            <p class="text-[11px] text-indigo-600 font-semibold mt-0.5">Across all locations</p>
          </div>
          <div class="bg-emerald-50/70 p-3.5 rounded-2xl border border-emerald-200">
            <span class="text-[11px] font-bold text-emerald-900 uppercase">Occupied Units</span>
            <p class="text-xl font-black text-emerald-800 mt-1">${occupiedProps.length} Flats</p>
            <p class="text-[11px] text-emerald-600 font-semibold mt-0.5">Active Tenants</p>
          </div>
          <div class="bg-amber-50/70 p-3.5 rounded-2xl border border-amber-200">
            <span class="text-[11px] font-bold text-amber-900 uppercase">Vacant Inventory</span>
            <p class="text-xl font-black text-amber-800 mt-1">${vacantProps.length} Ready</p>
            <p class="text-[11px] text-amber-600 font-semibold mt-0.5">Ready for Tenant</p>
          </div>
        </div>
      </div>
    `;
  } else {
    container.innerHTML = `
      <div class="p-6 text-center text-slate-600">
        <p class="font-bold text-sm">Detailed KPI Drilldown for ${kpiType.toUpperCase()}</p>
        <p class="text-xs text-slate-500 mt-1">Expected Rent: ${formatINR(totalExpected)} · Collected: ${formatINR(totalRealized)} · Overdue: ${formatINR(totalOverdue)}</p>
      </div>
    `;
  }
}
