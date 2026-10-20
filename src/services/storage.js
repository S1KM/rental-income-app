/**
 * Local Storage Persistence & Backup Engine
 * Provides resilient, quota-safe offline storage with export/import support
 */

import {
  STORAGE_KEY_PROPERTIES,
  STORAGE_KEY_TENANTS,
  STORAGE_KEY_MCD,
  STORAGE_KEY_LANDLORD,
  STORAGE_KEY_LEDGER_INSTALLMENTS,
  SAMPLE_PROPERTIES,
  SAMPLE_TENANTS,
  SAMPLE_MCD,
  DEFAULT_LANDLORD
} from '../config/constants.js';

export function loadStoredState() {
  let properties = SAMPLE_PROPERTIES;
  let tenants = SAMPLE_TENANTS;
  let mcdRecords = SAMPLE_MCD;
  let landlord = { ...DEFAULT_LANDLORD };
  let ledgerInstallments = {};

  try {
    const rawProps = localStorage.getItem(STORAGE_KEY_PROPERTIES);
    const rawTenants = localStorage.getItem(STORAGE_KEY_TENANTS);
    const rawMcd = localStorage.getItem(STORAGE_KEY_MCD);
    const rawLandlord = localStorage.getItem(STORAGE_KEY_LANDLORD);
    const rawInstallments = localStorage.getItem(STORAGE_KEY_LEDGER_INSTALLMENTS);

    if (rawProps) properties = JSON.parse(rawProps);
    if (rawTenants) tenants = JSON.parse(rawTenants);
    if (rawMcd) mcdRecords = JSON.parse(rawMcd);
    if (rawLandlord) landlord = { ...DEFAULT_LANDLORD, ...JSON.parse(rawLandlord) };
    if (rawInstallments) ledgerInstallments = JSON.parse(rawInstallments);
  } catch (err) {
    console.warn("Storage load failed, restoring default fixtures", err);
  }

  // Ensure available/unassigned tenant slots exist
  if (!tenants.some((t) => t.status === "Vacated" || !t.unit || (t.unit || "").toLowerCase().includes("unassigned"))) {
    tenants.push({
      id: "ten_unassigned_fallback",
      unit: "Unassigned / Available",
      name: "Rohit Malhotra",
      mobile: "9818800112",
      email: "rohit.m@example.com",
      rent: 12000,
      osAmount: 0,
      status: "Vacated",
      startDate: "",
      endDate: "",
      tenantIdNumber: "Aadhaar: 4410-2210-9901",
      permAddress: "C-14, Green Park Extension, New Delhi"
    });
  }

  return {
    properties,
    tenants,
    mcdRecords,
    landlord,
    ledgerInstallments
  };
}

export function persistState(state) {
  try {
    localStorage.setItem(STORAGE_KEY_PROPERTIES, JSON.stringify(state.properties || []));
    localStorage.setItem(STORAGE_KEY_TENANTS, JSON.stringify(state.tenants || []));
    localStorage.setItem(STORAGE_KEY_MCD, JSON.stringify(state.mcdRecords || []));
    localStorage.setItem(STORAGE_KEY_LANDLORD, JSON.stringify(state.landlord || DEFAULT_LANDLORD));
    localStorage.setItem(STORAGE_KEY_LEDGER_INSTALLMENTS, JSON.stringify(state.ledgerInstallments || {}));
    return true;
  } catch (err) {
    console.error("Critical: Failed to save to localStorage", err);
    return false;
  }
}

export function exportStateAsJson(state) {
  const payload = {
    app: "Rental Income & Property Manager",
    exportedAt: new Date().toISOString(),
    version: "3.0.0",
    data: {
      properties: state.properties,
      tenants: state.tenants,
      mcdRecords: state.mcdRecords,
      landlord: state.landlord,
      ledgerInstallments: state.ledgerInstallments
    }
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `Rental_Ledger_Backup_${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}
