---
sidebar_position: 2
---

# Records and Bundles

Pipe Protocol uses two main data structures for managing content: Records and Bundles. Understanding these structures is crucial for working with Pipe effectively.

## Pipe Records

A Pipe Record is the basic unit of storage in Pipe Protocol. It represents a single piece of data along with its metadata.

### Record Structure

```typescript
interface PipeRecord {
  type: 'data' | 'schema';
  content: any;
  scope: 'private' | 'public' | 'machine' | 'user';
  cid?: string;
  pinned?: boolean;
  encryption?: {
    enabled: boolean;
    method?: string;
    keyRef?: string;
  };
  accessPolicy?: {
    hiddenFromLLM: boolean;
    allowedTools?: string[];
  };
  metadata?: Record<string, any>;
  timestamp?: string;
}
```

### Record Fields

- **type**: Indicates whether this record contains data or a schema
- **content**: The actual data being stored
- **scope**: Determines the visibility and replication behavior
- **cid**: The IPFS Content Identifier (assigned after storage)
- **pinned**: Whether the content is pinned in IPFS
- **encryption**: Configuration for data encryption
- **accessPolicy**: Controls who can access the data
- **metadata**: Additional information about the record
- **timestamp**: When the record was created

## Pipe Bundles

A Pipe Bundle combines a data record with its corresponding schema record. This ensures that data can be properly validated and understood.

### Bundle Structure

```typescript
interface PipeBundle {
  schemaRecord: PipeRecord;
  dataRecord: PipeRecord;
  combinedScope: 'private' | 'public' | 'machine' | 'user';
  timestamp?: string;
}
```

### Bundle Fields

- **schemaRecord**: The record containing the JSON schema
- **dataRecord**: The record containing the actual data
- **combinedScope**: The scope that applies to both records
- **timestamp**: When the bundle was created

## Working with Records

### Creating a Record

```typescript
const record: PipeRecord = {
  type: 'data',
  content: { message: 'Hello, World!' },
  scope: 'private',
  accessPolicy: { hiddenFromLLM: false }
};

const published = await pipe.publishRecord(record);
```

### Fetching a Record

```typescript
const record = await pipe.fetchRecord(cid, 'private');
```

## Working with Bundles

### Creating a Bundle

```typescript
const bundle: PipeBundle = {
  schemaRecord: {
    type: 'schema',
    content: {
      type: 'object',
      properties: {
        message: { type: 'string' }
      }
    },
    scope: 'private',
    accessPolicy: { hiddenFromLLM: false }
  },
  dataRecord: {
    type: 'data',
    content: { message: 'Hello, World!' },
    scope: 'private',
    accessPolicy: { hiddenFromLLM: false }
  },
  combinedScope: 'private'
};

const published = await pipe.publishBundle(bundle);
```

### Automatic Bundle Creation

When using wrapped tools with schema generation enabled, bundles are created automatically:

```typescript
const wrappedTool = pipe.wrap([myTool])[0];
const result = await wrappedTool.call({ input: 'test' });

// Result includes both data CID and schema CID
console.log(result.cid);        // Data CID
console.log(result.schemaCid);  // Schema CID
```

## Best Practices

1. **Use Bundles**: Whenever possible, use bundles to keep data and schemas together
2. **Set Access Policies**: Always set appropriate access policies for your data
3. **Consider Scope**: Choose the appropriate scope for your use case
4. **Handle Encryption**: Use encryption for sensitive data
5. **Manage Pins**: Pin important data that needs to persist 