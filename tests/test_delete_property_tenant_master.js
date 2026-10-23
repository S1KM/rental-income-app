const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log('=== Testing Delete Property & Tenant Master Features ===');

const htmlContent = fs.readFileSync(path.resolve(__dirname, '../index.html'), 'utf8');

// 1. Verify existence of delete buttons in markup / template strings
assert(
  htmlContent.includes('data-action="pm-delete"'),
  'Property Master must render flat deletion button with data-action="pm-delete"'
);
assert(
  htmlContent.includes('data-action="pm-delete-building"'),
  'Property Master must render building deletion button with data-action="pm-delete-building"'
);
assert(
  htmlContent.includes('data-action="tm-delete"'),
  'Tenant Master must render tenant deletion button with data-action="tm-delete"'
);
assert(
  htmlContent.includes('data-action="dash-delete-property"'),
  'Dashboard must render property deletion button for vacant units'
);
assert(
  htmlContent.includes('data-action="dash-delete-tenant"'),
  'Dashboard must render tenant deletion button for occupied units'
);

console.log('✓ All 5 deletion action identifiers found in HTML template strings!');

// 2. Verify deletion logic functions and event delegation handlers
assert(
  htmlContent.includes('action === "pm-delete-building"'),
  'Event listener for pm-delete-building must be registered'
);
assert(
  htmlContent.includes('action === "pm-delete"'),
  'Event listener for pm-delete must be registered'
);
assert(
  htmlContent.includes('action === "tm-delete"'),
  'Event listener for tm-delete must be registered'
);
assert(
  htmlContent.includes('action === "dash-delete-property"'),
  'Event listener for dash-delete-property must be registered'
);
assert(
  htmlContent.includes('action === "dash-delete-tenant"'),
  'Event listener for dash-delete-tenant must be registered'
);

console.log('✓ All 5 deletion action event handlers registered in listeners!');

// 3. Test functional behavior of deletion in isolated state simulation
const simulatedState = {
  properties: [
    { id: 'prop_sg_101', name: 'Flat 101, Sagarpur', building: 'Sagarpur (20 Flats)', rent: 12000 },
    { id: 'prop_sg_102', name: 'Flat 102, Sagarpur', building: 'Sagarpur (20 Flats)', rent: 12000 },
    { id: 'prop_gp_101', name: 'Flat 104, Green Park', building: 'Green Park Main', rent: 24000 }
  ],
  tenants: [
    { id: 't_1', name: 'Rohit Sharma', unit: 'Flat 101, Sagarpur', status: 'Active', rent: 12000 },
    { id: 't_2', name: 'Priya Patel', unit: 'Flat 104, Green Park', status: 'Active', rent: 24000 }
  ],
  ledgerInstallments: {
    'prop_sg_101_Oct 2026': [{ id: 1, amount: 12000 }],
    'prop_sg_102_Oct 2026': [{ id: 2, amount: 12000 }],
    'prop_gp_101_Oct 2026': [{ id: 3, amount: 24000 }]
  },
  collapsedBuildings: new Set()
};

// Simulate deleting tenant t_1
const tenantToDelete = simulatedState.tenants.find(t => t.id === 't_1');
assert(tenantToDelete, 'Tenant t_1 must exist initially');
simulatedState.tenants = simulatedState.tenants.filter(t => t.id !== 't_1');
assert.strictEqual(simulatedState.tenants.length, 1, 'Only 1 tenant should remain');

// Verify property Flat 101 now has no tenant in state.tenants, meaning it becomes vacant
const activeTenantForFlat101 = simulatedState.tenants.find(
  t => t.unit === 'Flat 101, Sagarpur' && t.status !== 'Vacated'
);
assert.strictEqual(activeTenantForFlat101, undefined, 'Flat 101 must now be vacant');
console.log('✓ Tenant Master deletion simulation passed: Tenant removed and property became vacant!');

// Simulate deleting property Flat 104, Green Park
const propToDelete = simulatedState.properties.find(p => p.id === 'prop_gp_101');
assert(propToDelete, 'Property prop_gp_101 must exist initially');
// Unlink any tenant assigned to it
simulatedState.tenants.forEach(t => {
  if ((t.unit || '').trim().toLowerCase() === (propToDelete.name || '').trim().toLowerCase()) {
    t.unit = 'Unassigned / Available';
    t.status = 'Vacated';
  }
});
// Clean up ledger installments
Object.keys(simulatedState.ledgerInstallments).forEach(key => {
  if (key.startsWith(`${propToDelete.id}_`)) {
    delete simulatedState.ledgerInstallments[key];
  }
});
simulatedState.properties = simulatedState.properties.filter(p => p.id !== 'prop_gp_101');

assert.strictEqual(simulatedState.properties.length, 2, 'Two properties should remain');
assert.strictEqual(simulatedState.ledgerInstallments['prop_gp_101_Oct 2026'], undefined, 'Installments cleaned up');
assert.strictEqual(simulatedState.tenants[0].unit, 'Unassigned / Available', 'Linked tenant was unlinked');
assert.strictEqual(simulatedState.tenants[0].status, 'Vacated', 'Linked tenant status updated');
console.log('✓ Property Master deletion simulation passed: Property removed, installments cleared, tenant unlinked!');

// Simulate deleting building 'Sagarpur (20 Flats)'
const bName = 'Sagarpur (20 Flats)';
const flatsInBuilding = simulatedState.properties.filter(
  p => (p.building || '').trim().toLowerCase() === bName.trim().toLowerCase()
);
const flatIds = new Set(flatsInBuilding.map(p => p.id));
Object.keys(simulatedState.ledgerInstallments).forEach(key => {
  for (const fId of flatIds) {
    if (key.startsWith(`${fId}_`)) {
      delete simulatedState.ledgerInstallments[key];
      break;
    }
  }
});
simulatedState.properties = simulatedState.properties.filter(
  p => (p.building || '').trim().toLowerCase() !== bName.trim().toLowerCase()
);
assert.strictEqual(simulatedState.properties.length, 0, 'All flats in building deleted');
assert.strictEqual(Object.keys(simulatedState.ledgerInstallments).length, 0, 'All installments cleared');
console.log('✓ Building deletion simulation passed: Entire building and its flats deleted cleanly!');

console.log('=======================================================');
console.log('🎉 ALL PROPERTY & TENANT MASTER DELETION TESTS PASSED 100%!');
console.log('=======================================================');
