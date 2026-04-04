@extends('layouts.app')

@section('title', 'Dashboard')

@section('content')
    <h1 style="margin-top:0;">Dashboard</h1>
    <p style="color: var(--text-secondary);">Resumo operacional de chamados.</p>

    @if(isset($slaRisk) && $slaRisk > 0)
        <div class="flash" style="background:#FEE2E2;color:#B91C1C;border:1px solid #FECACA;">
            <strong>SLA resolução em risco / vencido:</strong> {{ $slaRisk }} ticket(s) com prazo ultrapassado (excl. pausas).
        </div>
    @endif

    @if(isset($minutesMonth))
        <p style="color:var(--text-secondary);">Minutos apontados no mês (todos os tickets): <strong>{{ $minutesMonth }}</strong></p>
    @endif

    <div class="card">
        <h2 style="margin-top:0;font-size:1rem;">Tickets por estado</h2>
        <ul style="list-style:none;padding:0;margin:0;display:flex;flex-wrap:wrap;gap:0.75rem;">
            @forelse ($statusCounts as $status => $count)
                <li>
                    @include('partials.status-badge', ['status' => $status])
                    <strong>{{ $count }}</strong>
                </li>
            @empty
                <li style="color: var(--text-muted);">Sem dados.</li>
            @endforelse
        </ul>
    </div>

    <div class="card">
        <h2 style="margin-top:0;font-size:1rem;">Últimos tickets</h2>
        <table>
            <thead>
            <tr>
                <th>Número</th>
                <th>Título</th>
                <th>Cliente</th>
                <th>Estado</th>
            </tr>
            </thead>
            <tbody>
            @foreach ($recentTickets as $t)
                <tr>
                    <td><a href="{{ route('tickets.show', $t) }}">{{ $t->number }}</a></td>
                    <td>{{ \Illuminate\Support\Str::limit($t->title, 50) }}</td>
                    <td>{{ $t->client->company_name }}</td>
                    <td>@include('partials.status-badge', ['status' => $t->status])</td>
                </tr>
            @endforeach
            </tbody>
        </table>
    </div>
@endsection
