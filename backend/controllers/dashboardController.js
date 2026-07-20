const Project = require("../models/Project");
const ProjectDocument = require("../models/ProjectDocument");
const ActivityLog = require("../models/ActivityLog");

const { DOCUMENT_TYPES } = ProjectDocument;

/**
 * GET /api/dashboard/stats
 *
 * Returns the counters shown on the dashboard:
 *   - totalProjects
 *   - totalIdeas
 *   - totalSwot
 *   - totalMarketingPlans
 *   - totalMarketing        (currently mirrors totalMarketingPlans; kept as
 *                             its own field so additional marketing-related
 *                             document types can be folded into it later
 *                             without changing the API shape)
 *   - byType: counts for EVERY ProjectDocument type, so new document types
 *             automatically show up without further backend changes
 */
async function getStats(req, res) {
  try {
    const userId = req.user._id;

    const [totalProjects, documentCounts] = await Promise.all([
      Project.countDocuments({ userId }),
      ProjectDocument.aggregate([
        { $match: { userId } },
        { $group: { _id: "$type", count: { $sum: 1 } } },
      ]),
    ]);

    const byType = {};
    for (const type of DOCUMENT_TYPES) byType[type] = 0;
    for (const row of documentCounts) byType[row._id] = row.count;

    const totalMarketingPlans = byType["marketing-plan"] || 0;

    res.json({
      success: true,
      data: {
        totalProjects,
        totalIdeas: byType["idea"] || 0,
        totalSwot: byType["swot"] || 0,
        totalMarketingPlans,
        // Mirrors totalMarketingPlans today; will combine additional
        // marketing-related document types as they're introduced.
        totalMarketing: totalMarketingPlans,
        byType,
      },
    });
  } catch (error) {
    console.error("getStats error:", error);
    res.status(500).json({ success: false, error: "Could not load dashboard stats" });
  }
}

/**
 * GET /api/dashboard/activity
 * Optional query: ?limit=10 (default 10, max 50)
 *
 * Returns the most recent activity entries (project + document
 * create/update/delete events) for the dashboard's "Recent Activity" feed.
 */
async function getActivity(req, res) {
  try {
    const userId = req.user._id;
    const rawLimit = parseInt(req.query.limit, 10);
    const limit = Number.isFinite(rawLimit) ? Math.min(Math.max(rawLimit, 1), 50) : 10;

    const activity = await ActivityLog.find({ userId })
      .sort({ createdAt: -1 })
      .limit(limit);

    res.json({ success: true, data: { activity, count: activity.length } });
  } catch (error) {
    console.error("getActivity error:", error);
    res.status(500).json({ success: false, error: "Could not load recent activity" });
  }
}

module.exports = { getStats, getActivity };
