import React from 'react';
import ComponentCreator from '@docusaurus/ComponentCreator';

export default [
  {
    path: '/__docusaurus/debug',
    component: ComponentCreator('/__docusaurus/debug', '5ff'),
    exact: true
  },
  {
    path: '/__docusaurus/debug/config',
    component: ComponentCreator('/__docusaurus/debug/config', '5ba'),
    exact: true
  },
  {
    path: '/__docusaurus/debug/content',
    component: ComponentCreator('/__docusaurus/debug/content', 'a2b'),
    exact: true
  },
  {
    path: '/__docusaurus/debug/globalData',
    component: ComponentCreator('/__docusaurus/debug/globalData', 'c3c'),
    exact: true
  },
  {
    path: '/__docusaurus/debug/metadata',
    component: ComponentCreator('/__docusaurus/debug/metadata', '156'),
    exact: true
  },
  {
    path: '/__docusaurus/debug/registry',
    component: ComponentCreator('/__docusaurus/debug/registry', '88c'),
    exact: true
  },
  {
    path: '/__docusaurus/debug/routes',
    component: ComponentCreator('/__docusaurus/debug/routes', '000'),
    exact: true
  },
  {
    path: '/markdown-page',
    component: ComponentCreator('/markdown-page', '3d7'),
    exact: true
  },
  {
    path: '/',
    component: ComponentCreator('/', 'e5f'),
    exact: true
  },
  {
    path: '/',
    component: ComponentCreator('/', '6c5'),
    routes: [
      {
        path: '/',
        component: ComponentCreator('/', '842'),
        routes: [
          {
            path: '/',
            component: ComponentCreator('/', 'a85'),
            routes: [
              {
                path: '/api-reference/configuration',
                component: ComponentCreator('/api-reference/configuration', '947'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/api-reference/fetch',
                component: ComponentCreator('/api-reference/fetch', 'eb6'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/api-reference/node-info',
                component: ComponentCreator('/api-reference/node-info', '63d'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/api-reference/node-status',
                component: ComponentCreator('/api-reference/node-status', 'fbc'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/api-reference/pin',
                component: ComponentCreator('/api-reference/pin', 'cd0'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/api-reference/pinned-cids',
                component: ComponentCreator('/api-reference/pinned-cids', '4aa'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/api-reference/publish',
                component: ComponentCreator('/api-reference/publish', 'a94'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/api-reference/publish-bundle',
                component: ComponentCreator('/api-reference/publish-bundle', '5bb'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/api-reference/replicate',
                component: ComponentCreator('/api-reference/replicate', 'de2'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/api-reference/storage-metrics',
                component: ComponentCreator('/api-reference/storage-metrics', '75b'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/api-reference/unpin',
                component: ComponentCreator('/api-reference/unpin', '074'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/core-concepts/encryption',
                component: ComponentCreator('/core-concepts/encryption', 'b35'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/core-concepts/inline-referenced',
                component: ComponentCreator('/core-concepts/inline-referenced', '921'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/core-concepts/pipebundle',
                component: ComponentCreator('/core-concepts/pipebundle', '289'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/core-concepts/piperecord',
                component: ComponentCreator('/core-concepts/piperecord', 'bf2'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/core-concepts/scopes',
                component: ComponentCreator('/core-concepts/scopes', 'c93'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/core-concepts/terminology',
                component: ComponentCreator('/core-concepts/terminology', '02d'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/intro',
                component: ComponentCreator('/intro', 'd0c'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/introduction/overview',
                component: ComponentCreator('/introduction/overview', '2e5'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/introduction/problem',
                component: ComponentCreator('/introduction/problem', 'a0f'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/introduction/solution',
                component: ComponentCreator('/introduction/solution', '313'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/tutorial-basics/congratulations',
                component: ComponentCreator('/tutorial-basics/congratulations', '58f'),
                exact: true
              },
              {
                path: '/tutorial-basics/create-a-blog-post',
                component: ComponentCreator('/tutorial-basics/create-a-blog-post', 'b9d'),
                exact: true
              },
              {
                path: '/tutorial-basics/create-a-document',
                component: ComponentCreator('/tutorial-basics/create-a-document', 'c74'),
                exact: true
              },
              {
                path: '/tutorial-basics/create-a-page',
                component: ComponentCreator('/tutorial-basics/create-a-page', '913'),
                exact: true
              },
              {
                path: '/tutorial-basics/deploy-your-site',
                component: ComponentCreator('/tutorial-basics/deploy-your-site', 'ca5'),
                exact: true
              },
              {
                path: '/tutorial-basics/markdown-features',
                component: ComponentCreator('/tutorial-basics/markdown-features', 'b4e'),
                exact: true
              },
              {
                path: '/tutorial-extras/manage-docs-versions',
                component: ComponentCreator('/tutorial-extras/manage-docs-versions', 'b1f'),
                exact: true
              },
              {
                path: '/tutorial-extras/translate-your-site',
                component: ComponentCreator('/tutorial-extras/translate-your-site', '4d4'),
                exact: true
              },
              {
                path: '/usage-examples/fetch-data',
                component: ComponentCreator('/usage-examples/fetch-data', 'f62'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/usage-examples/pin-unpin',
                component: ComponentCreator('/usage-examples/pin-unpin', 'fb9'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/usage-examples/publish-data',
                component: ComponentCreator('/usage-examples/publish-data', '84c'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/usage-examples/publish-hidden-data',
                component: ComponentCreator('/usage-examples/publish-hidden-data', '245'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/usage-examples/replicate-data',
                component: ComponentCreator('/usage-examples/replicate-data', '7ce'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/usage-examples/work-bundles',
                component: ComponentCreator('/usage-examples/work-bundles', '90f'),
                exact: true,
                sidebar: "docs"
              }
            ]
          }
        ]
      }
    ]
  },
  {
    path: '*',
    component: ComponentCreator('*'),
  },
];
