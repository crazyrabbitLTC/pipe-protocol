---
sidebar_position: 3
---

# Scopes

Scopes in Pipe Protocol determine how data is stored, accessed, and replicated across different contexts. Understanding scopes is crucial for managing data visibility and access control.

## Available Scopes

Pipe Protocol supports four different scopes:

- **private**: Data accessible only within the local context
- **public**: Data that can be shared and replicated across nodes
- **machine**: Data specific to the current machine/environment
- **user**: Data specific to the current user

## Scope Usage

### Setting Scope on Records

```typescript
const record: PipeRecord = {
  type: 'data',
  content: { message: 'Hello, World!' },
  scope: 'private', // Specify the scope here
  accessPolicy: { hiddenFromLLM: false }
};
```

### Setting Default Scope

You can set a default scope when initializing Pipe:

```typescript
const pipe = new Pipe({
  defaults: {
    scope: 'private'
  }
});
```

### Changing Scope

You can replicate data between scopes using the replicate method:

```typescript
await pipe.replicate(cid, 'private', 'public');
```

## Scope Behaviors

### Private Scope

- Data stays local to the current node
- Not automatically replicated
- Highest level of control
- Suitable for sensitive data

### Public Scope

- Data can be shared across nodes
- Automatically replicated when networking is enabled
- Suitable for shared resources
- Lower access control restrictions

### Machine Scope

- Data specific to the current machine
- Not replicated to other machines
- Persists across sessions
- Suitable for machine-specific configurations

### User Scope

- Data specific to the current user
- Not shared with other users
- Persists across sessions
- Suitable for user preferences and data

## Scope Isolation

Each scope maintains its own isolation:

```typescript
// Data in different scopes with same CID
const privateData = await pipe.fetchRecord(cid, 'private');
const publicData = await pipe.fetchRecord(cid, 'public');
```

## Best Practices

1. **Default to Private**: Start with private scope and only make public when necessary
2. **Scope Selection**: Choose the most restrictive scope that meets your needs
3. **Access Control**: Combine scopes with access policies for better control
4. **Documentation**: Document scope requirements for your data
5. **Replication Strategy**: Plan your data replication strategy across scopes

## Common Use Cases

### Private Development Data

```typescript
const devConfig: PipeRecord = {
  type: 'data',
  content: { apiKey: 'dev-key' },
  scope: 'private',
  accessPolicy: { hiddenFromLLM: true }
};
```

### Public Shared Resources

```typescript
const sharedResource: PipeRecord = {
  type: 'data',
  content: { commonData: 'shared' },
  scope: 'public',
  accessPolicy: { hiddenFromLLM: false }
};
```

### Machine Configuration

```typescript
const machineConfig: PipeRecord = {
  type: 'data',
  content: { machineId: 'xyz' },
  scope: 'machine',
  accessPolicy: { hiddenFromLLM: false }
};
```

### User Preferences

```typescript
const userPrefs: PipeRecord = {
  type: 'data',
  content: { theme: 'dark' },
  scope: 'user',
  accessPolicy: { hiddenFromLLM: false }
};
```

## Scope Management

### Checking Available Scopes

```typescript
const status = pipe.getStatus();
console.log(status.availableScopes);
```

### Monitoring Scope Usage

```typescript
const metrics = await pipe.getStorageMetrics('private');
console.log(metrics.totalSize, metrics.numObjects);
``` 