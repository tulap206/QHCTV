import { createClient } from '@supabase/supabase-js';
import { USERS, DEPARTMENTS, SEED_DATA } from './seedData';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

const isPlaceholder = !supabaseUrl || 
                      supabaseUrl.includes('your-project-id') || 
                      !supabaseAnonKey || 
                      supabaseAnonKey.includes('your-key-here');

let useLocalStorageFallback = isPlaceholder;

// Real Supabase client instance (if URL is valid format)
let realSupabase = null;
try {
  if (supabaseUrl && supabaseUrl.startsWith('http') && !isPlaceholder) {
    realSupabase = createClient(supabaseUrl, supabaseAnonKey);
  } else {
    useLocalStorageFallback = true;
  }
} catch (e) {
  useLocalStorageFallback = true;
}

const getLocalTable = (tableName) => {
  if (typeof window === 'undefined') {
    if (tableName === 'users') return USERS;
    if (tableName === 'departments') return DEPARTMENTS;
    return SEED_DATA[tableName] || [];
  }
  let data = localStorage.getItem(`pc02_${tableName}`);
  if (!data) {
    if (tableName === 'users') {
      localStorage.setItem(`pc02_users`, JSON.stringify(USERS));
      return USERS;
    }
    if (tableName === 'departments') {
      localStorage.setItem(`pc02_departments`, JSON.stringify(DEPARTMENTS));
      return DEPARTMENTS;
    }
    if (tableName === 'system_logs') {
      localStorage.setItem(`pc02_system_logs`, JSON.stringify([]));
      return [];
    }
    const seed = SEED_DATA[tableName];
    if (seed) {
      localStorage.setItem(`pc02_${tableName}`, JSON.stringify(seed));
      return seed;
    }
    return [];
  }
  return JSON.parse(data);
};

const setLocalTable = (tableName, data) => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(`pc02_${tableName}`, JSON.stringify(data));
};

class MockQueryBuilder {
  constructor(tableName) {
    this.tableName = tableName;
    this.filters = [];
    this.orderCol = null;
    this.orderAsc = true;
    this.limitCount = null;
    this.operation = 'select'; // 'select', 'insert', 'update', 'delete', 'upsert'
    this.opData = null;
  }

  select(fields) {
    this.operation = 'select';
    return this;
  }

  insert(data) {
    this.operation = 'insert';
    this.opData = data;
    return this;
  }

  update(data) {
    this.operation = 'update';
    this.opData = data;
    return this;
  }

  delete() {
    this.operation = 'delete';
    return this;
  }

  upsert(data) {
    this.operation = 'upsert';
    this.opData = data;
    return this;
  }

  eq(field, value) {
    this.filters.push({ type: 'eq', field, value });
    return this;
  }

  neq(field, value) {
    this.filters.push({ type: 'neq', field, value });
    return this;
  }

  in(field, values) {
    this.filters.push({ type: 'in', field, values });
    return this;
  }

  order(column, { ascending = true } = {}) {
    this.orderCol = column;
    this.orderAsc = ascending;
    return this;
  }

  limit(count) {
    this.limitCount = count;
    return this;
  }

  async executeLocal() {
    let list = getLocalTable(this.tableName);

    // Apply filters for select, update, delete
    const filterFn = (row) => {
      for (const filter of this.filters) {
        if (filter.type === 'eq') {
          if (row[filter.field] != filter.value) return false;
        } else if (filter.type === 'neq') {
          if (row[filter.field] == filter.value) return false;
        } else if (filter.type === 'in') {
          if (!filter.values.includes(row[filter.field])) return false;
        }
      }
      return true;
    };

    if (this.operation === 'select') {
      let result = list.filter(filterFn);
      if (this.orderCol) {
        result.sort((a, b) => {
          let valA = a[this.orderCol];
          let valB = b[this.orderCol];
          if (typeof valA === 'string') {
            return this.orderAsc ? valA.localeCompare(valB) : valB.localeCompare(valA);
          }
          return this.orderAsc ? (valA - valB) : (valB - valA);
        });
      }
      if (this.limitCount !== null) {
        result = result.slice(0, this.limitCount);
      }
      return { data: result, error: null };
    }

    if (this.operation === 'insert') {
      const rowsToInsert = Array.isArray(this.opData) ? this.opData : [this.opData];
      const inserted = rowsToInsert.map(row => {
        const id = row.id || (Math.max(0, ...list.map(r => r.id)) + 1);
        const newRow = { ...row, id };
        if (this.tableName === 'system_logs' && !newRow.time) {
          newRow.time = new Date().toISOString();
        }
        return newRow;
      });
      list = [...list, ...inserted];
      setLocalTable(this.tableName, list);
      return { data: inserted, error: null };
    }

    if (this.operation === 'update') {
      let updatedCount = 0;
      list = list.map(row => {
        if (filterFn(row)) {
          updatedCount++;
          return { ...row, ...this.opData };
        }
        return row;
      });
      setLocalTable(this.tableName, list);
      return { data: this.opData, error: null };
    }

    if (this.operation === 'delete') {
      const remaining = list.filter(row => !filterFn(row));
      setLocalTable(this.tableName, remaining);
      return { data: null, error: null };
    }

    if (this.operation === 'upsert') {
      const rowsToUpsert = Array.isArray(this.opData) ? this.opData : [this.opData];
      rowsToUpsert.forEach(row => {
        const index = list.findIndex(r => r.id === row.id || (row.ma_so && r.ma_so === row.ma_so) || (row.username && r.username === row.username));
        if (index > -1) {
          list[index] = { ...list[index], ...row };
        } else {
          const id = row.id || (Math.max(0, ...list.map(r => r.id)) + 1);
          list.push({ ...row, id });
        }
      });
      setLocalTable(this.tableName, list);
      return { data: rowsToUpsert, error: null };
    }

    return { data: null, error: 'Unsupported operation' };
  }

  then(onfulfilled, onrejected) {
    return this.executeLocal().then(onfulfilled, onrejected);
  }

  catch(onrejected) {
    return this.executeLocal().catch(onrejected);
  }

  finally(onfinally) {
    return this.executeLocal().finally(onfinally);
  }
}

// Wrapper client
class SupabaseWrapper {
  from(tableName) {
    if (useLocalStorageFallback) {
      return new MockQueryBuilder(tableName);
    }

    const realBuilder = realSupabase.from(tableName);
    return proxyBuilder(realBuilder, tableName);
  }
}

function proxyBuilder(builder, tableName) {
  return new Proxy(builder, {
    get(target, prop, receiver) {
      if (prop === 'then') {
        return (onfulfilled, onrejected) => {
          return target.then(
            (result) => {
              if (result.error && (result.error.message?.includes('FetchError') || result.error.status === 0 || result.error.message?.includes('failed to fetch') || result.error.message?.includes('API key') || tableName === 'trash_bin')) {
                console.warn(`Supabase query failed for ${tableName}, switching to LocalStorage fallback...`, result.error);
                return new MockQueryBuilder(tableName).executeLocal().then(onfulfilled, onrejected);
              }
              return onfulfilled ? onfulfilled(result) : result;
            },
            (err) => {
              if (!isPlaceholder) {
                return onrejected ? onrejected(err) : Promise.reject(err);
              }
              console.warn('Supabase query rejected, switching to LocalStorage fallback...', err);
              useLocalStorageFallback = true;
              return new MockQueryBuilder(tableName).executeLocal().then(onfulfilled, onrejected);
            }
          );
        };
      }
      if (prop === 'catch') {
        return (onrejected) => {
          return receiver.then(null, onrejected);
        };
      }
      if (prop === 'finally') {
        return (onfinally) => {
          return receiver.then(
            res => Promise.resolve(onfinally()).then(() => res),
            err => Promise.resolve(onfinally()).then(() => { throw err; })
          );
        };
      }
      const value = Reflect.get(target, prop, receiver);
      if (typeof value === 'function') {
        return (...args) => {
          const res = value.apply(target, args);
          if (res && typeof res.then === 'function') {
            return proxyBuilder(res, tableName);
          }
          return res;
        };
      }
      return value;
    }
  });
}

const supabaseWrapperInstance = new SupabaseWrapper();

export const supabase = new Proxy(supabaseWrapperInstance, {
  get(target, prop, receiver) {
    if (prop in target) {
      return Reflect.get(target, prop, receiver);
    }
    // Delegate to realSupabase if available and valid
    if (realSupabase && prop in realSupabase) {
      const val = Reflect.get(realSupabase, prop);
      if (typeof val === 'function') {
        return val.bind(realSupabase);
      }
      return val;
    }
    // Safe dummy fallback mock for real-time channels when offline/localstorage mode is active
    if (useLocalStorageFallback) {
      if (prop === 'channel') {
        return () => {
          const mockChannel = {
            on: () => mockChannel,
            subscribe: () => mockChannel
          };
          return mockChannel;
        };
      }
      if (prop === 'removeChannel') {
        return () => {};
      }
    }
    return undefined;
  }
});

export { useLocalStorageFallback };
