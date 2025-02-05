/** @type {import('@docusaurus/plugin-content-docs').SidebarsConfig} */
const sidebars = {
  tutorialSidebar: [
    'intro',
    {
      type: 'category',
      label: 'Core Concepts',
      items: [
        'core-concepts/tool-wrapping',
        'core-concepts/records-and-bundles',
        'core-concepts/scopes',
        'core-concepts/hooks'
      ]
    }
  ]
};

module.exports = sidebars; 