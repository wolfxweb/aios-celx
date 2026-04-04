<?php

namespace App\Http\Controllers;

use App\Models\Ticket;
use Illuminate\Http\Request;
use Illuminate\View\View;

class DashboardController extends Controller
{
    public function __invoke(Request $request): View
    {
        $user = $request->user();

        $base = Ticket::query()
            ->when($user->isTechnician() && ! $user->canSeeAllTickets(), function ($q) use ($user) {
                $q->where('assigned_to', $user->id);
            });

        $counts = (clone $base)
            ->selectRaw('status, count(*) as c')
            ->groupBy('status')
            ->pluck('c', 'status');

        $recentTickets = (clone $base)
            ->with(['client', 'assignee'])
            ->latest()
            ->limit(10)
            ->get();

        $slaRisk = (clone $base)
            ->whereNotNull('sla_due_at')
            ->where('sla_due_at', '<', now())
            ->whereNotIn('status', [
                Ticket::STATUS_CLOSED,
                Ticket::STATUS_CANCELLED,
                Ticket::STATUS_RESOLVED,
                ...config('sla.pause_resolution_statuses', []),
            ])
            ->count();

        $minutesMonth = \App\Models\TimeEntry::query()
            ->whereMonth('created_at', now()->month)
            ->whereYear('created_at', now()->year)
            ->sum('duration_minutes');

        return view('dashboard', [
            'statusCounts' => $counts,
            'recentTickets' => $recentTickets,
            'slaRisk' => $slaRisk,
            'minutesMonth' => $minutesMonth,
        ]);
    }
}
