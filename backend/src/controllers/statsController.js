import { User } from '../models/User.js';
import { Job } from '../models/Job.js';
import { Application } from '../models/Application.js';
import { Drive } from '../models/Drive.js';
import { getConnectionStatus } from '../config/database.js';

/**
 * Get aggregated placement statistics calculated directly from database records.
 * GET /api/stats
 * Does not return fabricated production metrics.
 */
export const getStats = async (req, res, next) => {
  try {
    const dbStatus = getConnectionStatus();
    if (!dbStatus.isConnected) {
      return res.status(503).json({
        success: false,
        error: { message: 'Database connection unavailable.', statusCode: 503 },
      });
    }

    // Run parallel aggregation queries on database collections
    const [
      totalRegisteredStudents,
      placedStudentsCount,
      activeDrivesCount,
      completedDrivesCount,
      totalApplicationsCount,
      applicationsByStatusAgg,
      salaryStatsAgg,
      departmentStatsAgg,
    ] = await Promise.all([
      User.countDocuments({ role: 'student' }),
      User.countDocuments({ role: 'student', 'studentProfile.placementStatus': 'placed' }),
      Drive.countDocuments({ status: { $in: ['upcoming', 'in_progress'] } }),
      Drive.countDocuments({ status: 'completed' }),
      Application.countDocuments(),
      Application.aggregate([
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
          },
        },
      ]),
      Job.aggregate([
        {
          $group: {
            _id: null,
            maxCtc: { $max: '$salaryPackage.ctcLpa' },
            avgCtc: { $avg: '$salaryPackage.ctcLpa' },
            minCtc: { $min: '$salaryPackage.ctcLpa' },
            count: { $sum: 1 },
          },
        },
      ]),
      User.aggregate([
        { $match: { role: 'student', department: { $exists: true, $ne: '' } } },
        {
          $group: {
            _id: '$department',
            total: { $sum: 1 },
            placed: {
              $sum: {
                $cond: [{ $eq: ['$studentProfile.placementStatus', 'placed'] }, 1, 0],
              },
            },
          },
        },
      ]),
    ]);

    // Format applications by status
    const applicationsByStatus = {};
    applicationsByStatusAgg.forEach((item) => {
      applicationsByStatus[item._id] = item.count;
    });

    // Format department stats
    const departmentBreakdown = departmentStatsAgg.map((dept) => ({
      department: dept._id,
      totalStudents: dept.total,
      placedStudents: dept.placed,
      placementPercentage:
        dept.total > 0 ? parseFloat(((dept.placed / dept.total) * 100).toFixed(1)) : 0,
    }));

    const salaryStats = salaryStatsAgg[0] || {
      maxCtc: 0,
      avgCtc: 0,
      minCtc: 0,
      count: 0,
    };

    const placementPercentage =
      totalRegisteredStudents > 0
        ? parseFloat(((placedStudentsCount / totalRegisteredStudents) * 100).toFixed(1))
        : 0;

    const summary = {
      totalRegisteredStudents,
      registeredStudents: totalRegisteredStudents,
      studentsPlaced: placedStudentsCount,
      placementPercentage,
      activeDrives: activeDrivesCount,
      completedDrives: completedDrivesCount,
      totalApplications: totalApplicationsCount,
      highestCtcLpa: salaryStats.maxCtc ? parseFloat(salaryStats.maxCtc.toFixed(2)) : 0,
      averageCtcLpa: salaryStats.avgCtc ? parseFloat(salaryStats.avgCtc.toFixed(2)) : 0,
      totalActiveJobs: salaryStats.count,
      studentsShortlisted: applicationsByStatus.shortlisted || applicationsByStatus.Shortlisted || 0,
      studentsSelected: placedStudentsCount || applicationsByStatus.selected || applicationsByStatus.Selected || 0,
    };

    const branchWise = departmentBreakdown.map((dept) => ({
      branch: dept.department,
      department: dept.department,
      total: dept.totalStudents,
      placed: dept.placedStudents,
      percentage: dept.placementPercentage,
      avgLpa: salaryStats.avgCtc ? parseFloat(salaryStats.avgCtc.toFixed(1)) : 0,
    }));

    res.status(200).json({
      success: true,
      data: {
        databaseCalculated: true,
        summary,
        overview: summary,
        applicationsByStatus,
        departmentBreakdown,
        branchWise,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
};

export default { getStats };
