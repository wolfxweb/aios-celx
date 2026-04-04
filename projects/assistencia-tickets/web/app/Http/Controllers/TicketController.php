<?php

namespace App\Http\Controllers;

use App\Models\Client;
use App\Models\Contact;
use App\Models\Equipment;
use App\Models\Ticket;
use App\Models\TicketInteraction;
use App\Models\User;
use App\Services\SlaService;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Illuminate\View\View;

class TicketController extends Controller
{
    use AuthorizesRequests;

    public function __construct(
        private readonly SlaService $sla,
    ) {}

    public function index(Request $request): View
    {
        $this->authorize('viewAny', Ticket::class);

        $q = $request->string('q')->trim();
        $user = $request->user();

        $tickets = Ticket::query()
            ->with(['client', 'assignee'])
            ->when($user->isTechnician() && ! $user->canSeeAllTickets(), function ($query) use ($user) {
                $query->where('assigned_to', $user->id);
            })
            ->when($q, fn ($query) => $query->where(function ($query) use ($q) {
                $query->where('number', 'like', "%{$q}%")
                    ->orWhere('title', 'like', "%{$q}%");
            }))
            ->latest()
            ->simplePaginate(20)
            ->withQueryString();

        return view('tickets.index', compact('tickets'));
    }

    public function create(): View
    {
        $this->authorize('create', Ticket::class);

        $clients = Client::query()->where('is_active', true)->orderBy('company_name')->get();
        $clientsOptions = $this->clientsOptionsForTickets();

        return view('tickets.create', compact('clients', 'clientsOptions'));
    }

    public function store(Request $request): RedirectResponse
    {
        $this->authorize('create', Ticket::class);

        $data = $request->validate([
            'client_id' => ['required', 'exists:clients,id'],
            'contact_id' => ['nullable', 'integer', Rule::exists('contacts', 'id')->where('client_id', $request->input('client_id'))],
            'equipment_id' => ['nullable', 'integer', Rule::exists('equipments', 'id')->where('client_id', $request->input('client_id'))],
            'category' => ['nullable', 'string', 'max:120'],
            'subcategory' => ['nullable', 'string', 'max:120'],
            'priority' => ['required', 'string', 'in:low,normal,high,critical'],
            'title' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'source' => ['nullable', 'string', 'max:32'],
        ]);

        $data['status'] = Ticket::STATUS_NEW;
        $data['opened_at'] = now();

        $ticket = Ticket::create($data);
        $this->sla->applyDeadlines($ticket);
        $ticket->save();

        return redirect()->route('tickets.show', $ticket)->with('status', 'Chamado aberto.');
    }

    public function show(Ticket $ticket): View
    {
        $this->authorize('view', $ticket);

        $ticket->load([
            'client', 'contact', 'equipment', 'assignee',
            'interactions.user', 'timeEntries.user', 'attachments.user',
        ]);

        return view('tickets.show', [
            'ticket' => $ticket,
            'sla' => $this->sla,
        ]);
    }

    public function edit(Ticket $ticket): View
    {
        $this->authorize('update', $ticket);

        $clients = Client::query()->where('is_active', true)->orderBy('company_name')->get();
        $users = User::query()->orderBy('name')->get();
        $clientsOptions = $this->clientsOptionsForTickets();

        return view('tickets.edit', compact('ticket', 'clients', 'users', 'clientsOptions'));
    }

    public function update(Request $request, Ticket $ticket): RedirectResponse
    {
        $this->authorize('update', $ticket);

        $data = $request->validate([
            'client_id' => ['required', 'exists:clients,id'],
            'contact_id' => ['nullable', 'integer', Rule::exists('contacts', 'id')->where('client_id', $request->input('client_id'))],
            'equipment_id' => ['nullable', 'integer', Rule::exists('equipments', 'id')->where('client_id', $request->input('client_id'))],
            'category' => ['nullable', 'string', 'max:120'],
            'subcategory' => ['nullable', 'string', 'max:120'],
            'priority' => ['required', 'string', 'in:low,normal,high,critical'],
            'status' => ['required', 'string', 'in:new,in_progress,waiting_customer,waiting_part,resolved,closed,cancelled'],
            'title' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'assigned_to' => ['nullable', 'exists:users,id'],
            'root_cause' => ['nullable', 'string', 'max:500'],
            'solution' => ['nullable', 'string'],
        ]);

        if ($data['status'] === Ticket::STATUS_CLOSED) {
            $request->validate([
                'solution' => ['required', 'string', 'min:3'],
                'root_cause' => ['required', 'string', 'min:2'],
                'assigned_to' => ['required', 'exists:users,id'],
            ]);

            $ticket->load('timeEntries');
            if ($ticket->totalMinutesLogged() < 1) {
                return back()->withErrors([
                    'status' => 'Para encerrar, registe pelo menos 1 minuto de horas neste ticket.',
                ])->withInput();
            }
        }

        $priorityChanged = $ticket->priority !== $data['priority'];

        $ticket->update($data);

        if ($priorityChanged) {
            $this->sla->applyDeadlines($ticket);
            $ticket->save();
        }

        if (in_array($data['status'], [Ticket::STATUS_RESOLVED, Ticket::STATUS_CLOSED], true)) {
            if (! $ticket->resolved_at) {
                $ticket->resolved_at = now();
            }
            if ($data['status'] === Ticket::STATUS_CLOSED) {
                $ticket->closed_at = now();
            }
            $ticket->save();
        }

        return redirect()->route('tickets.show', $ticket)->with('status', 'Chamado actualizado.');
    }

    public function destroy(Ticket $ticket): RedirectResponse
    {
        $this->authorize('delete', $ticket);
        $ticket->delete();

        return redirect()->route('tickets.index')->with('status', 'Ticket eliminado.');
    }

    public function storeInteraction(Request $request, Ticket $ticket): RedirectResponse
    {
        $this->authorize('update', $ticket);

        $data = $request->validate([
            'body' => ['required', 'string'],
            'is_internal' => ['sometimes', 'boolean'],
        ]);

        TicketInteraction::create([
            'ticket_id' => $ticket->id,
            'user_id' => $request->user()->id,
            'body' => $data['body'],
            'is_internal' => $request->boolean('is_internal'),
            'type' => 'comment',
        ]);

        if (! $ticket->first_response_at) {
            $ticket->update(['first_response_at' => now()]);
        }

        return redirect()->route('tickets.show', $ticket)->with('status', 'Interação registada.');
    }

    /**
     * @return list<array{id: int, contacts: list<array{id: int, label: string}>, equipments: list<array{id: int, label: string}>}>
     */
    protected function clientsOptionsForTickets(): array
    {
        return Client::query()
            ->where('is_active', true)
            ->with([
                'contacts:id,client_id,name,email',
                'equipment:id,client_id,internal_code,type,brand,model',
            ])
            ->orderBy('company_name')
            ->get()
            ->map(function (Client $c) {
                return [
                    'id' => $c->id,
                    'contacts' => $c->contacts->map(function (Contact $x) {
                        $label = $x->name;
                        if ($x->email) {
                            $label .= ' · '.$x->email;
                        }

                        return ['id' => $x->id, 'label' => $label];
                    })->values()->all(),
                    'equipments' => $c->equipment->map(function (Equipment $x) {
                        $parts = array_filter([$x->type, $x->brand, $x->model]);
                        $tail = $parts ? ' — '.implode(' ', $parts) : '';
                        $head = $x->internal_code ?: ('#'.$x->id);

                        return ['id' => $x->id, 'label' => $head.$tail];
                    })->values()->all(),
                ];
            })->values()->all();
    }
}
