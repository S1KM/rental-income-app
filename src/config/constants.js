/**
 * Rental Income & Property Manager - Application Constants & Sample Fixtures
 * Scalable Native ES Module Architecture
 */

export const STORAGE_KEY_PROPERTIES = "rpm_properties_master_v3";
export const STORAGE_KEY_TENANTS = "rpm_tenants_v3";
export const STORAGE_KEY_MCD = "rpm_mcd_tax_v3";
export const STORAGE_KEY_LANDLORD = "rpm_landlord_meta_v3";
export const STORAGE_KEY_LEDGER_INSTALLMENTS = "rpm_ledger_installments_v3";
export const STORAGE_KEY_SUPABASE_URL = "rpm_supabase_url";
export const STORAGE_KEY_SUPABASE_KEY = "rpm_supabase_key";
export const STORAGE_KEY_SUPABASE_AUTOSYNC = "rpm_supabase_autosync";

export function createSagarpurFlats() {
  const flats = [];
  for (let i = 1; i <= 20; i++) {
    const flatNum = 100 + i; // Flat 101 to Flat 120
    flats.push({
      id: "prop_sg_" + flatNum,
      building: "Sagarpur",
      name: `Flat ${flatNum}, Sagarpur`,
      address: "Plot 42-45, Main Bus Stand Road, Sagarpur, New Delhi - 110046",
      type: "1 BHK Residential Flat",
      rent: 12000,
      deposit: 24000,
      upic: "MCD-WZ-551042",
      meterNo: `BSES-SG-${flatNum}`
    });
  }
  return flats;
}

export function createSagarpurTenants() {
  const names = [
    "Manoj Kumar", "Suman Devi", "Amit Sharma", "Rajesh Gupta", "Pooja Singh",
    "Deepak Yadav", "Sunita Sharma", "Vikas Tiwari", "Anjali Verma", "Rakesh Jha",
    "Kavita Rani", "Suresh Chand", "Meena Kumari", "Anil Mishra", "Babita Rawat",
    "Santosh Negi", "Gaurav Joshi", "Preeti Chauhan"
  ];
  const tenants = [];
  // Flats 101 to 118 have active tenants
  for (let i = 0; i < 18; i++) {
    const flatNum = 101 + i;
    tenants.push({
      id: "ten_sg_" + flatNum,
      unit: `Flat ${flatNum}, Sagarpur`,
      name: names[i],
      mobile: `98180${String(10000 + i * 231).slice(-5)}`,
      email: `${names[i].toLowerCase().replace(/\s+/g, ".")}@example.com`,
      rent: 12000,
      osAmount: i === 2 ? 6000 : (i === 6 ? 12000 : 0),
      status: "Active",
      startDate: "2026-04-01",
      endDate: "2027-02-28",
      tenantIdNumber: `Aadhaar: ${2000 + i * 37}-${4000 + i * 29}-${8000 + i * 13}`
    });
  }
  // Flat 119 and Flat 120 in Sagarpur are intentionally VACANT
  return tenants;
}

export const SAMPLE_PROPERTIES = [
  ...createSagarpurFlats(),
  {
    id: "prop_1",
    building: "Green Park Main",
    name: "Flat 104, Green Park",
    address: "S-18, 1st Floor, Green Park Main, New Delhi - 110016",
    type: "2 BHK Residential Flat",
    rent: 24000,
    deposit: 48000,
    upic: "MCD-SZ-401129",
    meterNo: "BSES-10294811"
  },
  {
    id: "prop_2",
    building: "Saket Court",
    name: "Flat 201, Saket Court",
    address: "J-42, Saket Residential Enclave, New Delhi - 110017",
    type: "3 BHK Builder Floor",
    rent: 36000,
    deposit: 72000,
    upic: "MCD-SZ-778102",
    meterNo: "BSES-20491823"
  },
  {
    id: "prop_3",
    building: "Hauz Khas Village",
    name: "Studio 3B, Hauz Khas",
    address: "12-A, Hauz Khas Village Rd, New Delhi - 110016",
    type: "1 BHK Studio / Flat",
    rent: 18000,
    deposit: 36000,
    upic: "MCD-SZ-109283",
    meterNo: "BSES-90182744"
  },
  {
    id: "prop_4",
    building: "Kalkaji Market",
    name: "Shop 12, Kalkaji Market",
    address: "Market Complex No. 12, Kalkaji Main, New Delhi - 110019",
    type: "Commercial Shop / Office",
    rent: 42000,
    deposit: 84000,
    upic: "MCD-CZ-661201",
    meterNo: "BSES-88192031"
  }
];

export const SAMPLE_TENANTS = [
  ...createSagarpurTenants(),
  {
    id: "ten_1",
    unit: "Flat 104, Green Park",
    name: "Priya Patel",
    mobile: "9811012345",
    email: "priya.patel@example.com",
    rent: 24000,
    osAmount: 0,
    status: "Active",
    startDate: "2026-05-01",
    endDate: "2027-03-31",
    tenantIdNumber: "Aadhaar: 4891-2019-3312"
  },
  {
    id: "ten_2",
    unit: "Flat 201, Saket Court",
    name: "Rohan Khanna",
    mobile: "9810112233",
    email: "rohan.khanna@example.com",
    rent: 36000,
    osAmount: 18000,
    status: "Active",
    startDate: "2026-04-01",
    endDate: "2027-02-28",
    tenantIdNumber: "PAN: ABCPK9921Z"
  },
  {
    id: "ten_3",
    unit: "Studio 3B, Hauz Khas",
    name: "Aanya Verma",
    mobile: "9871234567",
    email: "aanya.v@example.com",
    rent: 18000,
    osAmount: 0,
    status: "Active",
    startDate: "2026-08-01",
    endDate: "2027-06-30",
    tenantIdNumber: "Aadhaar: 7712-4019-8821"
  },
  {
    id: "ten_unassigned_1",
    unit: "Unassigned / Available",
    name: "Vikram Rathore",
    mobile: "9818822334",
    email: "vikram.rathore@example.com",
    rent: 12000,
    osAmount: 0,
    status: "Vacated",
    startDate: "",
    endDate: "",
    tenantIdNumber: "Aadhaar: 3341-9921-1044",
    permAddress: "H.No. 45, Sector 21, Noida, UP"
  },
  {
    id: "ten_unassigned_2",
    unit: "Unassigned / Available",
    name: "Neha Sharma",
    mobile: "9871144556",
    email: "neha.sharma@example.com",
    rent: 12000,
    osAmount: 0,
    status: "Vacated",
    startDate: "",
    endDate: "",
    tenantIdNumber: "Aadhaar: 5542-8812-3390",
    permAddress: "D-12, Model Town, Delhi - 110009"
  }
];

export const SAMPLE_MCD = [
  {
    id: "mcd_sg",
    unit: "Plot 42-45, Sagarpur (20 Flats)",
    upic: "MCD-WZ-551042",
    year: "2026-27",
    tax: 18400,
    dueDate: "2026-06-30",
    status: "Pending",
    paidDate: null
  },
  {
    id: "mcd_1",
    unit: "Flat 104, Green Park",
    upic: "MCD-SZ-401129",
    year: "2026-27",
    tax: 4800,
    dueDate: "2026-06-30",
    status: "Paid",
    paidDate: "2026-06-15"
  },
  {
    id: "mcd_2",
    unit: "Flat 201, Saket Court",
    upic: "MCD-SZ-778102",
    year: "2026-27",
    tax: 7200,
    dueDate: "2026-06-30",
    status: "Pending",
    paidDate: null
  },
  {
    id: "mcd_3",
    unit: "Shop 12, Kalkaji Market",
    upic: "MCD-CZ-661201",
    year: "2026-27",
    tax: 12500,
    dueDate: "2026-06-30",
    status: "Pending",
    paidDate: null
  }
];

export const DEFAULT_LANDLORD = {
  name: "Rajesh Sharma",
  pan: "ABCPS1234D",
  email: "abcltd9925@gmail.com",
  phone: "",
  address: ""
};
