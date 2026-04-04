<?php

namespace App\Http\Controllers;

use App\Models\Ticket;
use App\Models\TimeEntry;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;

class TimeEntryController extends Controller
{
    public function store(Request $request, Ticket $ticket): RedirectResponse
    {
        Gate::authorize('update', $ticket);

        $data = $request->validate([
            'started_at' => ['required', 'date'],
            'ended_at' => ['nullable', 'date', 'after:started_at'],
            'duration_minutes' => ['nullable', 'integer', 'min:1', 'max:1440'],
            'activity_type' => ['nullable', 'string', 'max:120'],
            'description' => ['nullable', 'string', 'max:2000'],
            'billable' => ['sometimes', 'boolean'],
        ]);

        if (empty($data['duration_minutes']) && ! empty($data['ended_at'])) {
            $start = \Carbon\Carbon::parse($data['started_at']);
            $end = \Carbon\Carbon::parse($data['ended_at']);
            $data['duration_minutes'] = max(1, (int) $start->diffInMinutes($end));
        }

        if (empty($data['duration_minutes'])) {
            return back()->withErrors(['duration_minutes' => 'Indique duração em minutos ou hora final.'])->withInput();
        }

        TimeEntry::create([
            'ticket_id' => $ticket->id,
            'user_id' => $request->user()->id,
            'started_at' => $data['started_at'],
            'ended_at' => $data['ended_at'] ?? null,
            'duration_minutes' => $data['duration_minutes'],
            'activity_type' => $data['activity_type'] ?? null,
            'description' => $data['description'] ?? null,
            'billable' => $request->boolean('billable', true),
        ]);

        return redirect()->route('tickets.show', $ticket)->with('status', 'Horas registadas.');
    }

    public function destroy(Request $request, Ticket $ticket, TimeEntry $timeEntry): RedirectResponse
    {
        Gate::authorize('update', $ticket);
        abort_unless($timeEntry->ticket_id === $ticket->id, 404);

        if ($timeEntry->user_id !== $request->user()->id && ! $request->user()->isAdmin()) {
            abort(403);
        }

        $timeEntry->delete();

        return redirect()->route('tickets.show', $ticket)->with('status', 'Apontamento removido.');
    }
}
