<?php

namespace App\Http\Controllers;

use App\Models\Ticket;
use App\Models\TicketInteraction;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\View\View;

class PortalController extends Controller
{
    use AuthorizesRequests;

    public function index(Request $request): View
    {
        $user = $request->user();
        abort_unless($user->client_id, 403);

        $tickets = Ticket::query()
            ->where('client_id', $user->client_id)
            ->orderByDesc('opened_at')
            ->paginate(15);

        return view('portal.tickets.index', compact('tickets'));
    }

    public function show(Request $request, Ticket $ticket): View
    {
        $this->authorize('viewAsClient', $ticket);

        $ticket->load(['interactions' => function ($q) {
            $q->where('is_internal', false)->orderBy('created_at');
        }, 'interactions.user:id,name']);

        return view('portal.tickets.show', compact('ticket'));
    }

    public function storeComment(Request $request, Ticket $ticket): RedirectResponse
    {
        $this->authorize('commentAsClient', $ticket);

        $data = $request->validate([
            'body' => ['required', 'string', 'max:10000'],
        ]);

        TicketInteraction::create([
            'ticket_id' => $ticket->id,
            'user_id' => $request->user()->id,
            'body' => $data['body'],
            'is_internal' => false,
            'type' => 'comment',
        ]);

        return redirect()->route('portal.tickets.show', $ticket)->with('status', 'Mensagem enviada.');
    }
}
