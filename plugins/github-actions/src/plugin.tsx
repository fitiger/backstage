/*
 * Copyright 2020 The Backstage Authors
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import React from 'react';
import { githubActionsApiRef, GithubActionsClient } from './api';
import { rootRouteRef } from './routes';
import {
  configApiRef,
  createPlugin,
  createApiFactory,
  githubAuthApiRef,
  createRoutableExtension,
  createComponentExtension,
  NotificationApi,
} from '@backstage/core-plugin-api';
import ErrorIcon from '@material-ui/icons/Error';
import { v4 as uuid } from 'uuid';

export const githubActionsPlugin = createPlugin({
  id: 'github-actions',
  apis: [
    createApiFactory({
      api: githubActionsApiRef,
      deps: { configApi: configApiRef, githubAuthApi: githubAuthApiRef },
      factory: ({ configApi, githubAuthApi }) =>
        new GithubActionsClient({ configApi, githubAuthApi }),
    }),
  ],
  routes: {
    entityContent: rootRouteRef,
  },
  notificationChannels: [
    {
      id: 'github-actions-notification-source',
      initialize: (notificationApi: NotificationApi, _since?: number) => {
        setInterval(async () => {
          // Poll some backend for messages; potentially using a timestamp in the request to only
          // retrieve messages we haven't seen yet. May also pass the Backstage identity to filter
          // messages to only those applicable (global + user/team).
          const alerts = await Promise.resolve([
            {
              kind: 'alert',
              metadata: {
                message: 'sample notification',
                title: 'sample title',
                uuid: uuid(),
                timestamp: Date.now(),
                severity: 'warning',
              },
            },
          ]);
          alerts.forEach(a => notificationApi.post(a));
        }, 30 * 1000);
      },
    },
    {
      id: 'github-actions-user-notification-source',
      initialize: (notificationApi: NotificationApi) => {
        setInterval(async () => {
          const notifications = await Promise.resolve([
            {
              kind: 'tingle',
              metadata: {
                message:
                  'The queued build on component sample-component-name has failed with status: Error 500',
                title: 'Build failed',
                uuid: uuid(),
                timestamp: Date.now(),
              },
              spec: {
                icon: Math.random() > 0.5 ? <ErrorIcon /> : undefined,
                links: [
                  { url: '', title: 'View alert' },
                  { url: '', title: 'Go to entity' },
                ],
                targetEntityRefs: ['user:default/guest'],
              },
            },
          ]);
          notifications.forEach(n => notificationApi.post(n));
        }, 10 * 1000);
      },
    },
  ],
});

export const EntityGithubActionsContent = githubActionsPlugin.provide(
  createRoutableExtension({
    name: 'EntityGithubActionsContent',
    component: () => import('./components/Router').then(m => m.Router),
    mountPoint: rootRouteRef,
  }),
);

export const EntityLatestGithubActionRunCard = githubActionsPlugin.provide(
  createComponentExtension({
    name: 'EntityLatestGithubActionRunCard',
    component: {
      lazy: () =>
        import('./components/Cards').then(m => m.LatestWorkflowRunCard),
    },
  }),
);

export const EntityLatestGithubActionsForBranchCard =
  githubActionsPlugin.provide(
    createComponentExtension({
      name: 'EntityLatestGithubActionsForBranchCard',
      component: {
        lazy: () =>
          import('./components/Cards').then(
            m => m.LatestWorkflowsForBranchCard,
          ),
      },
    }),
  );

export const EntityRecentGithubActionsRunsCard = githubActionsPlugin.provide(
  createComponentExtension({
    name: 'EntityRecentGithubActionsRunsCard',
    component: {
      lazy: () =>
        import('./components/Cards').then(m => m.RecentWorkflowRunsCard),
    },
  }),
);