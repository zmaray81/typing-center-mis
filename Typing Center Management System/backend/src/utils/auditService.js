import { execute, getAll } from "../db.js";
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || "typing-center-secret-key-2024";

// Helper to extract user from JWT token
function getUserFromToken(req) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return { username: 'system', fullName: 'System' };
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);
    
    return {
      username: decoded.username || 'unknown',
      fullName: decoded.fullName || 'Unknown User',
      id: decoded.id
    };
  } catch (err) {
    console.error("Failed to decode token for audit:", err);
    return { username: 'system', fullName: 'System' };
  }
}

export async function logAudit({
  tableName,
  recordId,
  action,
  req = null,
  changedBy = null,
  oldData = null,
  newData = null,
  ipAddress = null,
  userAgent = null
}) {
  try {
    // Get user info from request if not provided
    let finalChangedBy = changedBy;
    if (!finalChangedBy && req) {
      const user = getUserFromToken(req);
      finalChangedBy = `${user.fullName} (${user.username})`;
      
      // Get IP and User Agent from request
      if (!ipAddress) {
        ipAddress = getClientIp(req);
      }
      if (!userAgent) {
        userAgent = req.headers['user-agent'] || null;
      }
    }
    
    // If still no changedBy, use 'system'
    if (!finalChangedBy) {
      finalChangedBy = 'system';
    }

    // Find changed fields
    let changedFields = [];
    if (oldData && newData) {
      changedFields = Object.keys(newData).filter(key => 
        JSON.stringify(oldData[key]) !== JSON.stringify(newData[key])
      );
    }

    // ✅ FIX: Stringify all JSON data for PostgreSQL JSONB
    const oldDataJson = oldData ? JSON.stringify(oldData) : null;
    const newDataJson = newData ? JSON.stringify(newData) : null;
    const changedFieldsJson = changedFields.length > 0 ? JSON.stringify(changedFields) : '[]';

    await execute(
      `INSERT INTO audit_log (
        table_name,
        record_id,
        action,
        changed_by,
        old_data,
        new_data,
        changed_fields,
        ip_address,
        user_agent
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [
        tableName,
        recordId,
        action,
        finalChangedBy,
        oldDataJson,
        newDataJson,
        changedFieldsJson,
        ipAddress,
        userAgent
      ]
    );

    console.log(`📝 Audit logged: ${action} on ${tableName}.${recordId} by ${finalChangedBy}`);
  } catch (error) {
    console.error("❌ Failed to log audit:", error);
    // Don't throw - audit failure shouldn't break main functionality
  }
}

// Helper to get client IP from request
export function getClientIp(req) {
  return req.ip || 
         req.headers['x-forwarded-for'] || 
         req.connection.remoteAddress || 
         req.socket?.remoteAddress || 
         'unknown';
}

// Get audit history for a record
export async function getAuditHistory(tableName, recordId) {
  try {
    const logs = await getAll(
      `SELECT * FROM audit_log 
       WHERE table_name = $1 AND record_id = $2 
       ORDER BY created_at DESC 
       LIMIT 50`,
      [tableName, recordId]
    );

    // PostgreSQL JSONB fields are already objects, no parsing needed
    return logs.map(log => ({
      ...log,
      old_data: log.old_data || null,
      new_data: log.new_data || null,
      changed_fields: log.changed_fields || []
    }));
  } catch (error) {
    console.error("❌ Failed to fetch audit history:", error);
    return [];
  }
}
