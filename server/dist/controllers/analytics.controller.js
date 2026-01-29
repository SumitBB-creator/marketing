"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPerformanceStats = exports.getDashboardStats = void 0;
const analytics_service_1 = require("../services/analytics.service");
const getDashboardStats = async (req, res) => {
    try {
        const stats = await analytics_service_1.analyticsService.getDashboardStats();
        res.json(stats);
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
};
exports.getDashboardStats = getDashboardStats;
const getPerformanceStats = async (req, res) => {
    try {
        const { date, marketer_id } = req.query;
        // @ts-ignore
        const user = req.user;
        let targetMarketerId = marketer_id;
        // If user is a marketer, they can only see their own stats
        if (user.role === 'marketer') {
            targetMarketerId = user.id;
        }
        const stats = await analytics_service_1.analyticsService.getPerformanceStats({
            date: date,
            marketer_id: targetMarketerId
        });
        res.json(stats);
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
};
exports.getPerformanceStats = getPerformanceStats;
