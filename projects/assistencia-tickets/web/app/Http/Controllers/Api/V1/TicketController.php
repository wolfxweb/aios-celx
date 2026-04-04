<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Ticket;
use App\Models\User;
use App\Services\SlaService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class TicketController extends Controller
{
    public function __construct(
        private readonly SlaService $sla,
    ) {}

    public function index(Request $request): JsonResponse
    {
        $user = $request->user();

        $tickets = Ticket::query()
            ->when($user->role === User::ROLE_CLIENT, fn ($q) => $q->where('client_id', $user->client_id))
            ->when($user->isTechnician() && ! $user->canSeeAllTickets(), fn ($q) => $q->where('assigned_to', $user->id))
            ->with(['client:id,company_name', 'assignee:id,name'])
            ->latest()
            ->paginate($request->integer('per_page', 20));

        return response()->json($tickets);
    }

    public function store(Request $request): JsonResponse
    {
        $user = $request->user();
        if ($user->role === User::ROLE_CLIENT) {
            abort(403, 'Clientes não criam tickets pela API nesta versão.');
        }

        $data = $request->validate([
            'client_id' => ['required', 'exists:clients,id'],
            'contact_id' => ['nullable', 'integer', Rule::exists('contacts', 'id')->where('client_id', $request->input('client_id'))],
            'equipment_id' => ['nullable', 'integer', Rule::exists('equipments', 'id')->where('client_id', $request->input('client_id'))],
            'category' => ['nullable', 'string', 'max:120'],
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
        $ticket->load('client');

        return response()->json($ticket, 201);
    }

    public function show(Ticket $ticket): JsonResponse
    {
        $user = request()->user();
        if ($user->role === User::ROLE_CLIENT) {
            abort_unless(
                $user->client_id && (int) $user->client_id === (int) $ticket->client_id,
                403
            );
            $ticket->load(['client', 'contact', 'equipment', 'assignee', 'interactions' => function ($q) {
                $q->where('is_internal', false);
            }, 'interactions.user']);
        } else {
            $ticket->load(['client', 'contact', 'equipment', 'assignee', 'interactions.user']);
        }

        return response()->json($ticket);
    }
}
