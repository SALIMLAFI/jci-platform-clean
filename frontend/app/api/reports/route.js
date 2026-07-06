import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import Contribution from "@/models/Contribution";
import Expense from "@/models/Expense";
import Project from "@/models/Project";
import User from "@/models/User";
import { getUserFromRequest } from "@/lib/auth";

export async function GET(request) {
  await dbConnect();

  const userPayload = getUserFromRequest(request);
  if (!userPayload) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    let contributionFilter = { status: "approved" };
    let expenseFilter = {};
    let dateFilter = {};

    if (startDate || endDate) {
      if (startDate) dateFilter.$gte = new Date(startDate);
      if (endDate) dateFilter.$lte = new Date(endDate);
      
      contributionFilter.createdAt = dateFilter;
      expenseFilter.date = dateFilter;
    }

    // Get all contributions and expenses
    const contributions = await Contribution.find(contributionFilter).populate('userId', 'name email');
    const expenses = await Expense.find(expenseFilter).populate('projectId', 'name');
    const projects = await Project.find({});
    const users = await User.find({});
    const pendingContributions = await Contribution.find({ status: 'pending' });

    // Basic financial metrics
    const totalIncome = contributions.reduce((acc, curr) => acc + curr.amount, 0);
    const totalExpenses = expenses.reduce((acc, curr) => acc + curr.amount, 0);
    const balance = totalIncome - totalExpenses;

    // Monthly trends (last 6 months)
    const monthlyData = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
      
      const monthContributions = contributions.filter(c => {
        const cDate = new Date(c.createdAt);
        return cDate >= monthDate && cDate <= monthEnd;
      });
      
      const monthExpenses = expenses.filter(e => {
        const eDate = new Date(e.date || e.createdAt);
        return eDate >= monthDate && eDate <= monthEnd;
      });

      const monthNames = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'];
      
      monthlyData.push({
        month: monthNames[monthDate.getMonth()],
        income: monthContributions.reduce((acc, c) => acc + c.amount, 0),
        expenses: monthExpenses.reduce((acc, e) => acc + e.amount, 0),
      });
    }

    // Expense breakdown by project
    const expenseByProject = {};
    expenses.forEach(expense => {
      const projectName = expense.projectId?.name || 'Non assigné';
      if (!expenseByProject[projectName]) {
        expenseByProject[projectName] = 0;
      }
      expenseByProject[projectName] += expense.amount;
    });

    const expenseBreakdown = Object.entries(expenseByProject).map(([name, value]) => ({
      name,
      value,
    }));

    // Additional metrics
    const totalMembers = users.length;
    const activeContributors = new Set(contributions.map(c => c.userId?._id)).size;
    const pendingApprovals = pendingContributions.length;
    const totalProjects = projects.length;
    const avgContribution = contributions.length > 0 ? totalIncome / contributions.length : 0;
    const avgExpense = expenses.length > 0 ? totalExpenses / expenses.length : 0;

    // Recent activity
    const recentContributions = contributions
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 5)
      .map(c => ({
        id: c._id,
        amount: c.amount,
        date: c.createdAt,
        user: c.userId?.name || 'Inconnu',
      }));

    const recentExpenses = expenses
      .sort((a, b) => new Date(b.date || b.createdAt) - new Date(a.date || a.createdAt))
      .slice(0, 5)
      .map(e => ({
        id: e._id,
        amount: e.amount,
        date: e.date || e.createdAt,
        description: e.description,
        project: e.projectId?.name || 'Non assigné',
      }));

    return NextResponse.json({
      // Financial metrics
      totalIncome,
      totalExpenses,
      balance,
      
      // Additional metrics
      totalMembers,
      activeContributors,
      pendingApprovals,
      totalProjects,
      avgContribution,
      avgExpense,
      
      // Chart data
      monthlyData,
      expenseBreakdown,
      
      // Recent activity
      recentContributions,
      recentExpenses,
    }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
