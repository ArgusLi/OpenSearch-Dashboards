/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import '../utils/commands.js';
import '../utils/dashboards/data_explorer/commands.js';

// Alternatively you can use CommonJS syntax:
// require('./commands')

Cypress.on('uncaught:exception', (_err) => {
  // returning false here prevents Cypress from failing the test
  return false;
});
