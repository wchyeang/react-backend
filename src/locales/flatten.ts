type NestedMessages = {
  [key: string]: string | NestedMessages;
};

export function flattenMessages(nested: NestedMessages, prefix = ''): Record<string, string> {
  return Object.entries(nested).reduce(
    (acc, [key, value]) => {
      const fullKey = prefix ? `${prefix}.${key}` : key;
      if (typeof value === 'string') {
        acc[fullKey] = value;
      } else {
        Object.assign(acc, flattenMessages(value, fullKey));
      }
      return acc;
    },
    {} as Record<string, string>,
  );
}
