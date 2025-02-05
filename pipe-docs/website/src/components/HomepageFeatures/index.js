import React from 'react';
import clsx from 'clsx';
import styles from './styles.module.css';

const FeatureList = [
  {
    title: 'IPFS Storage',
    description: (
      <>
        Store your LLM tool inputs and outputs on IPFS with configurable storage scopes and pinning options.
      </>
    ),
  },
  {
    title: 'Schema Generation',
    description: (
      <>
        Automatically generate and store JSON schemas for your data, making it easier to validate and understand tool outputs.
      </>
    ),
  },
  {
    title: 'Token Management',
    description: (
      <>
        Built-in token counting and limiting capabilities to help you manage your LLM tool outputs effectively.
      </>
    ),
  },
  {
    title: 'Encryption Support',
    description: (
      <>
        Secure your sensitive data with built-in encryption capabilities and flexible access policies.
      </>
    ),
  },
  {
    title: 'Hook System',
    description: (
      <>
        Extend functionality with pre and post-store hooks for custom data processing and validation.
      </>
    ),
  },
  {
    title: 'Easy Integration',
    description: (
      <>
        Simple API for wrapping existing tools and seamless integration with popular LLM platforms.
      </>
    ),
  },
];

function Feature({title, description}) {
  return (
    <div className={clsx('col col--4')}>
      <div className="text--center padding-horiz--md">
        <h3>{title}</h3>
        <p>{description}</p>
      </div>
    </div>
  );
}

export default function HomepageFeatures() {
  return (
    <section className={styles.features}>
      <div className="container">
        <div className="row">
          {FeatureList.map((props, idx) => (
            <Feature key={idx} {...props} />
          ))}
        </div>
      </div>
    </section>
  );
} 