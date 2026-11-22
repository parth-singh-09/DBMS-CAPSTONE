import { readOnlyPool } from '../../config/database.js';
import { PREDEFINED_QUERIES, PredefinedQuery } from './queryLab.catalog.js';

export class QueryLabService {
  getCatalog(): PredefinedQuery[] {
    return PREDEFINED_QUERIES;
  }

  getQueryById(id: string): PredefinedQuery | undefined {
    return PREDEFINED_QUERIES.find((q) => q.id === id);
  }

  async executeQuery(sql: string) {
    // 1. Strip comments (both single-line -- and multi-line /* */)
    const sanitized = sql
      .replace(/--.*$/gm, '')
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .trim();

    if (!sanitized) {
      throw new Error('Please provide a valid SQL statement.');
    }

    // 2. Reject multi-statement chaining
    const strippedTerminal = sanitized.replace(/;+\s*$/, '');
    if (strippedTerminal.includes(';')) {
      throw new Error(
        'Security Restriction: Multi-statement query execution is prohibited in Query Lab.'
      );
    }

    // 3. Prohibit all destructive/modifying operations (DDL, DML modifications, DCL)
    const destructiveRegex = /\b(DROP|TRUNCATE|ALTER|DELETE|UPDATE|INSERT|RENAME|CREATE|GRANT|REVOKE|FLUSH|KILL|SHUTDOWN)\b/i;
    if (destructiveRegex.test(sanitized)) {
      throw new Error(
        'Security Violation: Query Lab only permits read-only analytical queries. DDL (DROP, TRUNCATE, ALTER), DML modifications (DELETE, UPDATE, INSERT), and DCL operations are strictly prohibited in this interface.'
      );
    }

    // 4. Must begin with SELECT, WITH, or EXPLAIN
    const upper = sanitized.toUpperCase();
    const isReadOnly =
      upper.startsWith('SELECT') ||
      upper.startsWith('WITH') ||
      upper.startsWith('EXPLAIN');

    if (!isReadOnly) {
      throw new Error(
        'Security Restriction: Query Lab only executes read-only analytical queries (SELECT, WITH, EXPLAIN).'
      );
    }

    const startTime = performance.now();
    try {
      // Execute through the dedicated analyst read-only pool (least-privilege database user)
      const [rows, fields]: any = await readOnlyPool.query(sql);
      const executionTimeMs = parseFloat((performance.now() - startTime).toFixed(2));

      const columns = Array.isArray(fields)
        ? fields.map((f: any) => f.name)
        : rows.length > 0
        ? Object.keys(rows[0])
        : [];

      return {
        success: true,
        sql,
        executionTimeMs,
        rowCount: Array.isArray(rows) ? rows.length : 0,
        columns,
        rows: Array.isArray(rows) ? rows : [],
      };
    } catch (err: any) {
      const executionTimeMs = parseFloat((performance.now() - startTime).toFixed(2));
      return {
        success: false,
        sql,
        executionTimeMs,
        rowCount: 0,
        columns: [],
        rows: [],
        error: {
          code: err.code || 'SQL_ERROR',
          message: err.message,
          sqlState: err.sqlState,
        },
      };
    }
  }

  async executePredefined(id: string) {
    const query = this.getQueryById(id);
    if (!query) {
      throw new Error(`Predefined query with id "${id}" was not found.`);
    }

    const result = await this.executeQuery(query.sql);
    return {
      query,
      ...result,
    };
  }
}

export const queryLabService = new QueryLabService();
