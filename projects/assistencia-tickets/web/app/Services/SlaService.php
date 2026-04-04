<?php

namespace App\Services;

use App\Models\Ticket;
use Carbon\CarbonInterface;

class SlaService
{
    public function applyDeadlines(Ticket $ticket): void
    {
        $opened = $ticket->opened_at ?? now();
        $p = $ticket->priority;

        $responseH = (int) config("sla.response_hours.$p", 24);
        $resolutionH = (int) config("sla.resolution_hours.$p", 120);

        $ticket->sla_response_due_at = $this->addHours($opened, $responseH);
        $ticket->sla_due_at = $this->addHours($opened, $resolutionH);
    }

    public function resolutionDeadline(Ticket $ticket): ?CarbonInterface
    {
        if (! $ticket->sla_due_at) {
            return null;
        }

        if ($this->isResolutionPaused($ticket)) {
            return null;
        }

        return $ticket->sla_due_at;
    }

    public function isResolutionPaused(Ticket $ticket): bool
    {
        return in_array($ticket->status, config('sla.pause_resolution_statuses', []), true);
    }

    public function isResolutionOverdue(Ticket $ticket): bool
    {
        if ($this->isResolutionPaused($ticket) || in_array($ticket->status, [Ticket::STATUS_CLOSED, Ticket::STATUS_CANCELLED, Ticket::STATUS_RESOLVED], true)) {
            return false;
        }

        return $ticket->sla_due_at && now()->greaterThan($ticket->sla_due_at);
    }

    public function isResponseOverdue(Ticket $ticket): bool
    {
        if ($ticket->first_response_at || in_array($ticket->status, [Ticket::STATUS_CLOSED, Ticket::STATUS_CANCELLED], true)) {
            return false;
        }

        return $ticket->sla_response_due_at && now()->greaterThan($ticket->sla_response_due_at);
    }

    private function addHours(CarbonInterface $from, int $hours): CarbonInterface
    {
        return $from->copy()->addHours($hours);
    }
}
