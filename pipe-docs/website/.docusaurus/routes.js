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
    path: '/docs',
    component: ComponentCreator('/docs', '16f'),
    routes: [
      {
        path: '/docs',
        component: ComponentCreator('/docs', '94e'),
        routes: [
          {
            path: '/docs',
            component: ComponentCreator('/docs', '9e4'),
            routes: [
              {
                path: '/docs/api-reference/pipe',
                component: ComponentCreator('/docs/api-reference/pipe', 'b39'),
                exact: true
              },
              {
                path: '/docs/core-concepts/hooks',
                component: ComponentCreator('/docs/core-concepts/hooks', '6f5'),
                exact: true,
                sidebar: "tutorialSidebar"
              },
              {
                path: '/docs/core-concepts/records-and-bundles',
                component: ComponentCreator('/docs/core-concepts/records-and-bundles', 'f3e'),
                exact: true,
                sidebar: "tutorialSidebar"
              },
              {
                path: '/docs/core-concepts/scopes',
                component: ComponentCreator('/docs/core-concepts/scopes', '416'),
                exact: true,
                sidebar: "tutorialSidebar"
              },
              {
                path: '/docs/core-concepts/tool-wrapping',
                component: ComponentCreator('/docs/core-concepts/tool-wrapping', 'fb2'),
                exact: true,
                sidebar: "tutorialSidebar"
              },
              {
                path: '/docs/getting-started/installation',
                component: ComponentCreator('/docs/getting-started/installation', '2f7'),
                exact: true
              },
              {
                path: '/docs/guides/basic-usage',
                component: ComponentCreator('/docs/guides/basic-usage', '583'),
                exact: true
              },
              {
                path: '/docs/intro',
                component: ComponentCreator('/docs/intro', '61d'),
                exact: true,
                sidebar: "tutorialSidebar"
              }
            ]
          }
        ]
      }
    ]
  },
  {
    path: '/',
    component: ComponentCreator('/', '2e1'),
    exact: true
  },
  {
    path: '*',
    component: ComponentCreator('*'),
  },
];
