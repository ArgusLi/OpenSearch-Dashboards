/*
 * SPDX-License-Identifier: Apache-2.0
 *
 * The OpenSearch Contributors require contributions made to
 * this file be licensed under the Apache-2.0 license or a
 * compatible open source license.
 *
 * Any modifications Copyright OpenSearch Contributors. See
 * GitHub history for details.
 */

/*
 * Licensed to Elasticsearch B.V. under one or more contributor
 * license agreements. See the NOTICE file distributed with
 * this work for additional information regarding copyright
 * ownership. Elasticsearch B.V. licenses this file to you under
 * the Apache License, Version 2.0 (the "License"); you may
 * not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

import { i18n } from '@osd/i18n';
import { CoreSystem } from './core_system';
import { ApmSystem } from './apm_system';

/** @internal */
export async function __osdBootstrap__() {
  const injectedMetadata = JSON.parse(
    document.querySelector('osd-injected-metadata')!.getAttribute('data')!
  );

  const globals: any = typeof window === 'undefined' ? {} : window;
  const themeTag: string = globals.__osdThemeTag__ || '';

  injectedMetadata.branding.darkMode = themeTag.endsWith('dark');

  let i18nError: Error | undefined;
  const apmSystem = new ApmSystem(injectedMetadata.vars.apmConfig, injectedMetadata.basePath);

  await Promise.all([
    // eslint-disable-next-line no-console
    apmSystem.setup().catch(console.warn),
    i18n.load(injectedMetadata.i18n.translationsUrl).catch((error) => {
      i18nError = error;
    }),
  ]);

  const coreSystem = new CoreSystem({
    injectedMetadata,
    rootDomElement: document.body,
    browserSupportsCsp: !(window as any).__osdCspNotEnforced__,
  });

  const setup = await coreSystem.setup();
  if (i18nError && setup) {
    setup.fatalErrors.add(i18nError);
  }

  const start = await coreSystem.start();
  await apmSystem.start(start);

  // Display the i18n warning if it exists
  if ((window as any).__i18nWarning) {
    const warning = (window as any).__i18nWarning;
    // eslint-disable-next-line no-console
    console.warn(`${warning.title}: ${warning.text}`);
    delete (window as any).__i18nWarning;
  }

  // Display the locale warning if it exists
  if ((window as any).__localeWarning) {
    const warning = (window as any).__localeWarning;
    // eslint-disable-next-line no-console
    console.warn(`${warning.title}: ${warning.text}`);
    delete (window as any).__localeWarning;
  }
}
