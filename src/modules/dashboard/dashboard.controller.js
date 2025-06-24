const sendJson = require("../../core/sendJson");
const { checkAuth, checkRole, DEFAULT_ROLES } = require("../../utils/checkAuth");
const Report = require("../../models/report.model");
const Dumpster = require("../../models/dumpsters.model");
const User = require("../../models/user.model");

// get dashboard analytics for all user types
const getDashboardAnalytics = async (req, res) => {
  try {
    const user = await checkAuth(req.config, req.headers);
    
    // get neighborhood stats
    const neighborhoodStats = await Report.aggregate([
      {
        $lookup: {
          from: 'dumpsters',
          localField: 'dumpsterId',
          foreignField: '_id',
          as: 'dumpsterInfo'
        }
      },
      { $unwind: '$dumpsterInfo' },
      {
        $group: {
          _id: '$dumpsterInfo.neighborhood',
          totalReports: { $sum: 1 },
          pending: { $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] } },
          inProgress: { $sum: { $cond: [{ $eq: ['$status', 'in_progress'] }, 1, 0] } },
          resolved: { $sum: { $cond: [{ $eq: ['$status', 'resolved'] }, 1, 0] } },
          overflowing: { $sum: { $cond: [{ $eq: ['$issue', 'overflowing'] }, 1, 0] } },
          badOdors: { $sum: { $cond: [{ $eq: ['$issue', 'bad_odors'] }, 1, 0] } },
          categories: { $push: '$category' }
        }
      }
    ]);

    // calculate cleanliness scores
    const enrichedStats = neighborhoodStats.map(stat => {
      const cleanlinessScore = stat.totalReports 
        ? 100 - ((stat.pending + stat.overflowing + stat.badOdors) / stat.totalReports) * 100
        : 100;
      
      return {
        ...stat,
        cleanlinessScore: Math.round(cleanlinessScore * 10) / 10
      };
    });

    // sort by cleanliness score
    enrichedStats.sort((a, b) => b.cleanlinessScore - a.cleanlinessScore);

    // get category distribution
    const categoryStats = await Report.aggregate([
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 }
        }
      }
    ]);

    // get user stats by role
    const userStats = await User.aggregate([
      {
        $group: {
          _id: '$role',
          count: { $sum: 1 }
        }
      }
    ]);

    // get recent reports based on user role
    let recentReports = [];
    if (user.role === 'citizen') {
      recentReports = await Report.find({ reporterId: user._id })
        .sort({ createdAt: -1 })
        .limit(5)
        .populate('dumpsterId', 'neighborhood street city');
    } else if (user.role === 'authorized_personnel') {
      recentReports = await Report.find({ status: { $in: ['pending', 'in_progress'] } })
        .sort({ createdAt: -1 })
        .limit(10)
        .populate('reporterId', 'username')
        .populate('dumpsterId', 'neighborhood street city');
    } else if (user.role === 'decision_maker' || user.role === 'admin') {
      recentReports = await Report.find({})
        .sort({ createdAt: -1 })
        .limit(10)
        .populate('reporterId', 'username')
        .populate('dumpsterId', 'neighborhood street city');
    }

    // get weekly trend data
    const weeklyTrend = await Report.aggregate([
      {
        $match: {
          createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
        }
      },
      {
        $group: {
          _id: { $dayOfWeek: '$createdAt' },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id': 1 } }
    ]);

    sendJson(res, 200, {
      message: "Dashboard analytics retrieved successfully",
      data: {
        neighborhoodStats: enrichedStats,
        categoryStats,
        userStats,
        recentReports,
        weeklyTrend,
        userRole: user.role
      }
    });

  } catch (error) {
    sendJson(res, 500, {
      message: "Internal server error",
      error: error.message
    });
  }
};

// get neighborhood comparison data for decision makers
const getNeighborhoodComparison = async (req, res) => {
  try {
    const user = await checkAuth(req.config, req.headers);
    
    // check if user has permission to view this data
    if (!['decision_maker', 'admin', 'authorized_personnel'].includes(user.role)) {
      sendJson(res, 403, { message: "Access denied" });
      return;
    }

    const comparison = await Report.aggregate([
      {
        $lookup: {
          from: 'dumpsters',
          localField: 'dumpsterId',
          foreignField: '_id',
          as: 'dumpsterInfo'
        }
      },
      { $unwind: '$dumpsterInfo' },
      {
        $group: {
          _id: {
            neighborhood: '$dumpsterInfo.neighborhood',
            month: { $month: '$createdAt' },
            year: { $year: '$createdAt' }
          },
          totalReports: { $sum: 1 },
          pending: { $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] } },
          resolved: { $sum: { $cond: [{ $eq: ['$status', 'resolved'] }, 1, 0] } }
        }
      },
      {
        $group: {
          _id: '$_id.neighborhood',
          monthlyData: {
            $push: {
              month: '$_id.month',
              year: '$_id.year',
              totalReports: '$totalReports',
              pending: '$pending',
              resolved: '$resolved',
              efficiency: {
                $round: [
                  { $multiply: [{ $divide: ['$resolved', '$totalReports'] }, 100] },
                  1
                ]
              }
            }
          }
        }
      }
    ]);

    sendJson(res, 200, {
      message: "Neighborhood comparison data retrieved successfully",
      data: comparison
    });

  } catch (error) {
    sendJson(res, 500, {
      message: "Internal server error", 
      error: error.message
    });
  }
};

module.exports = {
  getDashboardAnalytics,
  getNeighborhoodComparison
}; 