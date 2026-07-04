/**
 * ACTIVITY LOGGER
 *
 * Tiny helper shared by the project and project-document controllers so
 * that every create/update/delete consistently writes an ActivityLog
 * entry for the dashboard's "Recent Activity" feed.
 *
 * Logging failures are swallowed (and just warned to the console) so a
 * problem writing the activity feed never blocks the user's actual
 * request from succeeding.
 */

const ActivityLog = require("../models/ActivityLog");

/**
 * @param {Object} params
 * @param {string} params.userId
 * @param {string|null} [params.projectId]
 * @param {string|null} [params.documentId]
 * @param {string} params.entityType  - "project" | one of ProjectDocument.DOCUMENT_TYPES
 * @param {string} params.action      - "created" | "updated" | "deleted"
 * @param {string} [params.projectTitle]
 * @param {string} [params.documentTitle]
 * @param {Object} [params.meta]
 */
async function logActivity({
  userId,
  projectId = null,
  documentId = null,
  entityType,
  action,
  projectTitle = "",
  documentTitle = "",
  meta = {},
}) {
  try {
    await ActivityLog.create({
      userId,
      projectId,
      documentId,
      entityType,
      action,
      projectTitle,
      documentTitle,
      meta,
    });
  } catch (error) {
    console.warn("logActivity warning:", error.message);
  }
}

module.exports = { logActivity };
