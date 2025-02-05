---
sidebar_position: 4
---

# Hooks

Hooks in Pipe Protocol provide a way to extend and customize the behavior of data processing. They allow you to execute custom logic before and after data is stored in IPFS.

## Hook Types

Pipe Protocol supports two types of hooks:

- **pre-store**: Executed before data is stored in IPFS
- **post-store**: Executed after data is stored in IPFS

## Hook Interface

```typescript
interface PipeHook {
    name: string;
    handler: (data: any, metadata: Record<string, any>) => Promise<any>;
    trigger: 'pre-store' | 'post-store';
}
```

## Using Hooks

### Adding Hooks

You can add hooks when initializing Pipe:

```typescript
const summaryHook: PipeHook = {
    name: 'data-summarizer',
    trigger: 'pre-store',
    async handler(data: any, metadata: any) {
        const summary = await generateSummary(data);
        return {
            ...data,
            metadata: {
                ...metadata,
                summary
            }
        };
    }
};

const pipe = new Pipe({
    hooks: [summaryHook]
});
```

### Adding Hooks Later

You can also add hooks after initialization:

```typescript
pipe.addHooks([{
    name: 'logger',
    trigger: 'post-store',
    async handler(data: any, metadata: any) {
        console.log(`Stored data with CID: ${metadata.cid}`);
        return data;
    }
}]);
```

### Removing Hooks

```typescript
pipe.removeHook('data-summarizer');
```

## Common Hook Use Cases

### Data Transformation

```typescript
const transformHook: PipeHook = {
    name: 'data-transformer',
    trigger: 'pre-store',
    async handler(data: any) {
        // Transform data before storage
        return transformData(data);
    }
};
```

### Validation

```typescript
const validationHook: PipeHook = {
    name: 'data-validator',
    trigger: 'pre-store',
    async handler(data: any) {
        if (!isValid(data)) {
            throw new Error('Invalid data');
        }
        return data;
    }
};
```

### Logging

```typescript
const loggingHook: PipeHook = {
    name: 'logger',
    trigger: 'post-store',
    async handler(data: any, metadata: any) {
        console.log(`Stored ${metadata.size} bytes at ${metadata.cid}`);
        return data;
    }
};
```

### Metadata Enhancement

```typescript
const metadataHook: PipeHook = {
    name: 'metadata-enhancer',
    trigger: 'pre-store',
    async handler(data: any, metadata: any) {
        return {
            ...data,
            metadata: {
                ...metadata,
                timestamp: new Date().toISOString(),
                version: '1.0.0'
            }
        };
    }
};
```

## Hook Execution Order

Hooks are executed in the order they were added:

1. All pre-store hooks run in sequence
2. Data is stored in IPFS
3. All post-store hooks run in sequence

## Best Practices

1. **Keep Hooks Simple**: Each hook should have a single responsibility
2. **Handle Errors**: Always include error handling in your hooks
3. **Preserve Data Structure**: Don't modify the core data structure unless necessary
4. **Document Hooks**: Document what each hook does and its requirements
5. **Consider Performance**: Be mindful of hook execution time

## Example: Complete Hook System

Here's an example of a complete hook system:

```typescript
// Define hooks
const hooks = [
    {
        name: 'validator',
        trigger: 'pre-store',
        async handler(data: any) {
            if (!isValid(data)) {
                throw new Error('Invalid data');
            }
            return data;
        }
    },
    {
        name: 'transformer',
        trigger: 'pre-store',
        async handler(data: any) {
            return transformData(data);
        }
    },
    {
        name: 'logger',
        trigger: 'post-store',
        async handler(data: any, metadata: any) {
            console.log(`Stored data: ${metadata.cid}`);
            return data;
        }
    }
];

// Initialize Pipe with hooks
const pipe = new Pipe({ hooks });

// Use wrapped tools
const wrappedTool = pipe.wrap([myTool])[0];
const result = await wrappedTool.call({ input: 'test' });
```

## Debugging Hooks

To debug hooks, you can add a debug hook:

```typescript
const debugHook: PipeHook = {
    name: 'debugger',
    trigger: 'pre-store',
    async handler(data: any, metadata: any) {
        console.log('Pre-store data:', data);
        console.log('Metadata:', metadata);
        return data;
    }
};
``` 