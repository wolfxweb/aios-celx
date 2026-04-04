@extends('layouts.app')

@section('title', $ticket->number)

@section('content')
    <div style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:1rem;">
        <div>
            <h1 style="margin-top:0;">{{ $ticket->number }}</h1>
            <p style="margin:0;">{{ $ticket->title }}</p>
            <p style="color:var(--text-secondary);margin:0.5rem 0 0;">@include('partials.status-badge', ['status' => $ticket->status])</p>
        </div>
        <div style="display:flex;gap:0.5rem;flex-wrap:wrap;">
            @can('update', $ticket)
                <a href="{{ route('tickets.edit', $ticket) }}" class="btn btn-primary">Editar</a>
            @endcan
            <a href="{{ route('tickets.index') }}" class="btn btn-ghost">Lista</a>
            @can('delete', $ticket)
                <form method="post" action="{{ route('tickets.destroy', $ticket) }}" onsubmit="return confirm('Eliminar este ticket?');" style="display:inline;margin:0;">
                    @csrf
                    @method('DELETE')
                    <button type="submit" class="btn btn-ghost" style="color:#B91C1C;">Eliminar</button>
                </form>
            @endcan
        </div>
    </div>

    <div class="card">
        <p><strong>Cliente:</strong> <a href="{{ route('clients.show', $ticket->client) }}">{{ $ticket->client->company_name }}</a></p>
        @if ($ticket->contact)
            <p><strong>Contacto:</strong> {{ $ticket->contact->name }} @if($ticket->contact->email) ({{ $ticket->contact->email }}) @endif</p>
        @endif
        @if ($ticket->equipment)
            <p><strong>Equipamento:</strong> {{ $ticket->equipment->internal_code ?: '#'.$ticket->equipment->id }}
                — {{ collect([$ticket->equipment->type, $ticket->equipment->brand, $ticket->equipment->model])->filter()->implode(' ') ?: '—' }}</p>
        @endif
        <p><strong>Prioridade:</strong> {{ $ticket->priority }}</p>
        <p><strong>Aberto em:</strong> {{ $ticket->opened_at?->format('d/m/Y H:i') }}</p>
        @if ($ticket->sla_response_due_at)
            <p><strong>SLA 1.ª resposta até:</strong> {{ $ticket->sla_response_due_at->format('d/m/Y H:i') }}
                @if($ticket->first_response_at)
                    <span class="badge" style="background:var(--status-resolved);">Respondido</span>
                @elseif($sla->isResponseOverdue($ticket))
                    <span class="badge" style="background:#B91C1C;">SLA resposta vencido</span>
                @endif
            </p>
        @endif
        @if ($ticket->sla_due_at)
            <p><strong>SLA resolução até:</strong> {{ $ticket->sla_due_at->format('d/m/Y H:i') }}
                @if($sla->isResolutionPaused($ticket))
                    <span class="badge" style="background:var(--status-waiting-customer);">Pausa (estado)</span>
                @elseif($sla->isResolutionOverdue($ticket))
                    <span class="badge" style="background:#B91C1C;">SLA resolução vencido</span>
                @endif
            </p>
        @endif
        @if ($ticket->assignee)
            <p><strong>Técnico:</strong> {{ $ticket->assignee->name }}</p>
        @endif
        <p><strong>Horas registadas:</strong> {{ $ticket->totalMinutesLogged() }} min</p>
        <div style="margin-top:1rem;">
            <strong>Descrição</strong>
            <p style="white-space:pre-wrap;">{{ $ticket->description ?: '—' }}</p>
        </div>
        @if ($ticket->root_cause || $ticket->solution)
            <div style="margin-top:1rem;">
                <p><strong>Causa raiz:</strong> {{ $ticket->root_cause ?: '—' }}</p>
                <p><strong>Solução:</strong> {{ $ticket->solution ?: '—' }}</p>
            </div>
        @endif
    </div>

    @can('update', $ticket)
    <div class="card">
        <h2 style="margin-top:0;font-size:1rem;">Apontamento de horas</h2>
        <table style="margin-bottom:1rem;">
            <thead>
            <tr><th>Data</th><th>Utilizador</th><th>Min</th><th>Actividade</th><th></th></tr>
            </thead>
            <tbody>
            @foreach ($ticket->timeEntries as $te)
                <tr>
                    <td>{{ $te->started_at->format('d/m/Y H:i') }}</td>
                    <td>{{ $te->user->name }}</td>
                    <td>{{ $te->duration_minutes }}</td>
                    <td>{{ $te->activity_type ?? '—' }}</td>
                    <td>
                        @if($te->user_id === auth()->id() || auth()->user()->isAdmin())
                            <form method="post" action="{{ route('tickets.time-entries.destroy', [$ticket, $te]) }}" style="display:inline;" onsubmit="return confirm('Remover?');">
                                @csrf
                                @method('DELETE')
                                <button type="submit" class="btn btn-ghost" style="padding:0.15rem 0.5rem;font-size:0.75rem;">✕</button>
                            </form>
                        @endif
                    </td>
                </tr>
            @endforeach
            </tbody>
        </table>
        <form method="post" action="{{ route('tickets.time-entries.store', $ticket) }}">
            @csrf
            <div class="field">
                <label>Início</label>
                <input type="datetime-local" name="started_at" value="{{ old('started_at', now()->format('Y-m-d\TH:i')) }}" required>
            </div>
            <div class="field">
                <label>Fim (opcional — calcula minutos)</label>
                <input type="datetime-local" name="ended_at" value="{{ old('ended_at') }}">
            </div>
            <div class="field">
                <label>Ou minutos directamente</label>
                <input type="number" name="duration_minutes" min="1" max="1440" value="{{ old('duration_minutes') }}" placeholder="ex.: 30">
            </div>
            <div class="field">
                <label>Tipo de actividade</label>
                <input type="text" name="activity_type" value="{{ old('activity_type') }}" placeholder="Remoto, visita…">
            </div>
            <div class="field">
                <label>Descrição</label>
                <textarea name="description" rows="2">{{ old('description') }}</textarea>
            </div>
            <label><input type="checkbox" name="billable" value="1" @checked(old('billable', true))> Faturável</label>
            <div style="margin-top:0.5rem;">
                <button type="submit" class="btn btn-primary">Registar horas</button>
            </div>
        </form>
    </div>

    <div class="card">
        <h2 style="margin-top:0;font-size:1rem;">Anexos</h2>
        <ul style="margin:0 0 1rem;padding-left:1.2rem;">
            @forelse ($ticket->attachments as $att)
                <li>
                    {{ $att->original_name }} ({{ number_format($att->size_bytes / 1024, 1) }} KB)
                    <form method="post" action="{{ route('tickets.attachments.destroy', [$ticket, $att]) }}" style="display:inline;" onsubmit="return confirm('Remover anexo?');">
                        @csrf
                        @method('DELETE')
                        <button type="submit" class="btn btn-ghost" style="padding:0;font-size:0.8rem;">Remover</button>
                    </form>
                </li>
            @empty
                <li style="color:var(--text-muted);">Nenhum anexo.</li>
            @endforelse
        </ul>
        <form method="post" action="{{ route('tickets.attachments.store', $ticket) }}" enctype="multipart/form-data">
            @csrf
            <div class="field">
                <label>Ficheiro (máx. 10 MB)</label>
                <input type="file" name="file" required>
            </div>
            <button type="submit" class="btn btn-primary">Enviar</button>
        </form>
    </div>
    @endcan

    <div class="card">
        <h2 style="margin-top:0;font-size:1rem;">Interações</h2>
        @foreach ($ticket->interactions as $i)
            <div style="border-bottom:1px solid var(--border);padding:0.75rem 0;">
                <div style="font-size:0.8rem;color:var(--text-muted);">
                    {{ $i->created_at->format('d/m/Y H:i') }} — {{ $i->user->name }}
                    @if ($i->is_internal) <span class="badge" style="background:var(--text-muted);">Interno</span> @endif
                </div>
                <div style="white-space:pre-wrap;">{{ $i->body }}</div>
            </div>
        @endforeach

        @can('update', $ticket)
        <form method="post" action="{{ route('tickets.interactions.store', $ticket) }}" style="margin-top:1rem;">
            @csrf
            <div class="field">
                <label for="body">Nova interação</label>
                <textarea id="body" name="body" rows="3" required>{{ old('body') }}</textarea>
            </div>
            <label><input type="checkbox" name="is_internal" value="1" @checked(old('is_internal'))> Interno (não visível ao cliente)</label>
            <div style="margin-top:0.5rem;">
                <button type="submit" class="btn btn-primary">Registar</button>
            </div>
        </form>
        @endcan
    </div>
@endsection
