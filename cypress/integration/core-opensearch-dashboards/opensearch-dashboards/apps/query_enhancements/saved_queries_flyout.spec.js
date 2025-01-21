/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  INDEX_PATTERN_WITH_TIME,
  INDEX_WITH_TIME_1,
  INDEX_WITH_TIME_2,
  SECONDARY_ENGINE,
  START_TIME,
  END_TIME,
} from '../../../../../utils/constants';

import {
  workspaceName,
  datasourceName,
} from '../../../../../utils/apps/query_enhancements/saved_search';

import {
  generateAllTestConfigurations,
  setDatePickerDatesAndSearchIfRelevant,
  verifyDiscoverPageState,
  verifyQueryDoesNotExistInSavedQueries,
  setQueryConfigurations,
  updateAndVerifySavedQuery,
} from '../../../../../utils/apps/query_enhancements/saved_queries';

// This spec assumes data.savedQueriesNewUI.enabled is true.

export const runSavedQueriesFlyoutUITests = () => {
  describe('saved queries flyout UI', () => {
    before(() => {
      // Load test data
      cy.setupTestData(
        SECONDARY_ENGINE.url,
        [
          `cypress/fixtures/query_enhancements/data-logs-1/${INDEX_WITH_TIME_1}.mapping.json`,
          `cypress/fixtures/query_enhancements/data-logs-2/${INDEX_WITH_TIME_2}.mapping.json`,
        ],
        [
          `cypress/fixtures/query_enhancements/data-logs-1/${INDEX_WITH_TIME_1}.data.ndjson`,
          `cypress/fixtures/query_enhancements/data-logs-2/${INDEX_WITH_TIME_2}.data.ndjson`,
        ]
      );
      // Add data source
      cy.addDataSource({
        name: datasourceName,
        url: 'http://opensearch-node:9200/',
        authType: 'no_auth',
      });

      // Create workspace
      cy.deleteWorkspaceByName(workspaceName);
      cy.visit('/app/home');
      cy.createInitialWorkspaceWithDataSource(datasourceName, workspaceName);
      cy.createWorkspaceIndexPatterns({
        workspaceName: workspaceName,
        indexPattern: INDEX_PATTERN_WITH_TIME.replace('*', ''),
        timefieldName: 'timestamp',
        dataSource: datasourceName,
        isEnhancement: true,
      });
    });

    after(() => {
      // No need to explicitly delete all saved queries as deleting the workspace will delete associated saved queries
      cy.deleteWorkspaceByName(workspaceName);
      // // TODO: Modify deleteIndex to handle an array of index and remove hard code
      cy.deleteDataSourceByName(datasourceName);
      cy.deleteIndex(INDEX_WITH_TIME_1);
      cy.deleteIndex(INDEX_WITH_TIME_2);
    });

    const testConfigurations = generateAllTestConfigurations();
    testConfigurations.forEach((config) => {
      it(`should successfully create a saved query for ${config.testName}`, () => {
        cy.navigateToWorkSpaceSpecificPage({
          workspaceName,
          page: 'discover',
          isEnhancement: true,
        });

        cy.setDataset(config.dataset, datasourceName, config.datasetType);

        cy.setQueryLanguage(config.language);
        setDatePickerDatesAndSearchIfRelevant(config.language, START_TIME, END_TIME);

        setQueryConfigurations(config);
        verifyDiscoverPageState(config);
        cy.saveQuery(config.saveName, ' ', true, true, true);
      });
    });

    describe('should see and load all saved queries', () => {
      testConfigurations.forEach((config) => {
        it(`Load query name: ${config.testName}`, () => {
          cy.getElementByTestId('discoverNewButton').click();
          setDatePickerDatesAndSearchIfRelevant(
            config.language,
            'Aug 29, 2020 @ 00:00:00.000',
            'Aug 30, 2020 @ 00:00:00.000'
          );

          cy.loadSaveQuery(config.saveName, true);
          // wait for saved queries to load.
          cy.wait(2000);
          verifyDiscoverPageState(config);
        });
        it(`should successfully update the loaded ${config.testName} saved query`, () => {
          updateAndVerifySavedQuery(config, true);
        });
      });
    });
    it.skip('should delete a saved query', () => {
      cy.navigateToWorkSpaceSpecificPage({
        workspaceName,
        page: 'discover',
        isEnhancement: true,
      });

      cy.deleteSaveQuery('OpenSearch SQL-INDEX_PATTERN', true);
      verifyQueryDoesNotExistInSavedQueries('OpenSearch SQL-INDEX_PATTERN', true);
    });
  });
};

runSavedQueriesFlyoutUITests();
