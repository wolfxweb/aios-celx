<?php

namespace App\Http\Controllers;

use App\Models\Ticket;
use App\Models\TimeEntry;
use Illuminate\Http\Request;
use Illuminate\View\View;

class ReportsController extends Controller
{
    public function __invoke(Request $request): View
    {
        $fromDay = $request->date('from') ?? now()->subDays(30);
        $toDay = $request->date('to') ?? now();

        $from = $fromDay->copy()->startOfDay();
        $to = $toDay->copy()->endOfDay();

        $ticketsOpened = Ticket::query()
            ->whereBetween('opened_at', [$from, $to])
            ->count();

        $ticketsClosed = Ticket::query()
            ->where('status', Ticket::STATUS_CLOSED)
            ->whereBetween('closed_at', [$from, $to])
            ->count();

        $byStatus = Ticket::query()
            ->selectRaw('status, count(*) as c')
            ->groupBy('status')
            ->pluck('c', 'status');

        $minutesLogged = (int) TimeEntry::query()
            ->whereBetween('created_at', [$from, $to])
            ->sum('duration_minutes');

        $slaViolations = Ticket::query()
            ->where('sla_due_at', '<', now())
            ->whereNotIn('status', [Ticket::STATUS_CLOSED, Ticket::STATUS_CANCELLED, Ticket::STATUS_RESOLVED])
            ->whereNotIn('status', config('sla.pause_resolution_statuses', []))
            ->count();

        return view('reports.index', [
            'from' => $fromDay,
            'to' => $toDay,
            'ticketsOpened' => $ticketsOpened,
            'ticketsClosed' => $ticketsClosed,
            'byStatus' => $byStatus,
            'minutesLogged' => $minutesLogged,
            'slaViolations' => $slaViolations,
        ]);
    }
}
