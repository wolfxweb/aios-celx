<?php

namespace App\Policies;

use App\Models\Ticket;
use App\Models\User;

class TicketPolicy
{
    public function viewAny(User $user): bool
    {
        return true;
    }

    public function view(User $user, Ticket $ticket): bool
    {
        return $user->canSeeAllTickets() || $ticket->assigned_to === $user->id;
    }

    public function create(User $user): bool
    {
        return true;
    }

    public function update(User $user, Ticket $ticket): bool
    {
        if ($user->isAdmin()) {
            return true;
        }

        if ($user->canSeeAllTickets()) {
            return true;
        }

        return $user->isTechnician() && $ticket->assigned_to === $user->id;
    }

    public function delete(User $user, Ticket $ticket): bool
    {
        return $user->isAdmin();
    }

    public function viewAsClient(User $user, Ticket $ticket): bool
    {
        if (! $user->isClient() || ! $user->client_id) {
            return false;
        }

        return (int) $user->client_id === (int) $ticket->client_id;
    }

    public function commentAsClient(User $user, Ticket $ticket): bool
    {
        return $this->viewAsClient($user, $ticket);
    }
}
