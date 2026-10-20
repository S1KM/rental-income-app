/**
 * Central Reactive State Store & Dispatcher
 * Provides scalable reactive subscriptions, optimistic updates, and automatic persistence
 */

import {
  DEFAULT_LANDLORD,
  SAMPLE_PROPERTIES,
  SAMPLE_TENANTS,
  SAMPLE_MCD
} from '../config/constants.js';
import { loadStoredState, persistState } from '../services/storage.js';
import { isSupabaseAutoSyncEnabled, pushToSupabase } from '../services/supabase.js';

class Store {
  constructor() {
    this.listeners = new Set();
    this.state = {
      properties: [],
      tenants: [],
      mcdRecords: [],
      landlord: { ...DEFAULT_LANDLORD },
      activeTab: "dashboard",
      activeFilter: "all", // 'all' | 'occupied' | 'vacant' | 'os' | 'expiring' | 'paid'
      dashLocationFilter: "all",
      dashViewMode: "table",
      dashSearchQuery: "",
      dashSortBy: "unit",
      pmLocationFilter: "all",
      tmActiveFilter: "all",
      collapsedBuildings: new Set(),
      reportType: "rent-roll",
      reportPropertyId: null,
      activeLedgerPropId: null,
      ledgerFilter: "all",
      ledgerSort: "asc",
      reportLocation: "all",
      reportStatus: "all",
      reportSearch: "",
      activeKpiTab: "occupancy",
      ledgerInstallments: {},
      activePartialPayPropId: null,
      activePartialPayCycle: null,
      editingInstallmentIndex: null
    };
  }

  init() {
    const loaded = loadStoredState();
    this.state.properties = loaded.properties;
    this.state.tenants = loaded.tenants;
    this.state.mcdRecords = loaded.mcdRecords;
    this.state.landlord = loaded.landlord;
    this.state.ledgerInstallments = loaded.ledgerInstallments;

    // Attach to window.state for backward compatibility and automated tests
    if (typeof window !== 'undefined') {
      window.state = this.state;
    }
    return this.state;
  }

  getState() {
    return this.state;
  }

  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  notify(eventType = "change", payload = null) {
    this.listeners.forEach((listener) => {
      try {
        listener(this.state, eventType, payload);
      } catch (err) {
        console.error("Subscriber error in store notification:", err);
      }
    });
  }

  save(skipCloudSync = false) {
    persistState(this.state);
    if (!skipCloudSync && isSupabaseAutoSyncEnabled()) {
      pushToSupabase(this.state, true).catch((e) =>
        console.warn("Auto-sync background push failed", e)
      );
    }
    this.notify("save");
  }

  resetSampleData() {
    this.state.properties = JSON.parse(JSON.stringify(SAMPLE_PROPERTIES));
    this.state.tenants = JSON.parse(JSON.stringify(SAMPLE_TENANTS));
    this.state.mcdRecords = JSON.parse(JSON.stringify(SAMPLE_MCD));
    this.state.landlord = { ...DEFAULT_LANDLORD };
    this.state.ledgerInstallments = {};
    this.save();
    this.notify("reset");
  }

  setTab(tab) {
    this.state.activeTab = tab;
    this.notify("tab_change", tab);
  }

  setFilter(key, value) {
    this.state[key] = value;
    this.notify("filter_change", { key, value });
  }

  updateLandlord(updates) {
    this.state.landlord = { ...this.state.landlord, ...updates };
    this.save();
    this.notify("landlord_updated", this.state.landlord);
  }
}

export const store = new Store();
