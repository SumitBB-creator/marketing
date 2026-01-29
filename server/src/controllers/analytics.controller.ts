import { Request, Response } from 'express';
import { analyticsService } from '../services/analytics.service';

export const getDashboardStats = async (req: Request, res: Response) => {
    try {
        const stats = await analyticsService.getDashboardStats();
        res.json(stats);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

export const getPerformanceStats = async (req: Request, res: Response) => {
    try {
        const { date, marketer_id } = req.query;
        // @ts-ignore
        const user = req.user;

        let targetMarketerId = marketer_id as string;

        // If user is a marketer, they can only see their own stats
        if (user.role === 'marketer') {
            targetMarketerId = user.id;
        }

        const stats = await analyticsService.getPerformanceStats({
            date: date as string,
            marketer_id: targetMarketerId
        });
        res.json(stats);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
}
