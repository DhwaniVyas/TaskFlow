async function getDashboard(req, res, next) {
  try {
    res.status(200).json({
      success: true,
      message: "Dashboard loaded",
      data: {
        user: {
          id: req.user._id,
          fullName: req.user.fullName,
          email: req.user.email,
          role: req.user.role,
        },
        overview: {
          totalTasks: 0,
          completedTasks: 0,
          activeProjects: 0,
          productivityScore: 0,
        },
      },
    });
  } catch (error) {
    next(error);
  }
}

module.exports = { getDashboard };
