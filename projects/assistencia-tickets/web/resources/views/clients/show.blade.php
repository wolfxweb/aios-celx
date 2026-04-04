@extends('layouts.app')

@section('title', $client->company_name)

@section('content')
    <div style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:1rem;">
        <div>
            <h1 style="margin-top:0;">{{ $client->company_name }}</h1>
            <p style="color:var(--text-secondary);margin:0;">{{ $client->trade_name }}</p>
        </div>
        <div style="display:flex;gap:0.5rem;flex-wrap:wrap;">
            <a href="{{ route('clients.contacts.create', $client) }}" class="btn btn-primary">Novo contacto</a>
            <a href="{{ route('clients.equipments.create', $client) }}" class="btn btn-primary">Novo equipamento</a>
            <a href="{{ route('clients.edit', $client) }}" class="btn btn-ghost">Editar</a>
            <a href="{{ route('clients.index') }}" class="btn btn-ghost">Lista</a>
        </div>
    </div>

    <div class="card">
        <h2 style="margin-top:0;font-size:1rem;">Dados</h2>
        <p><strong>CPF/CNPJ:</strong> {{ $client->tax_id ?? '—' }}</p>
        <p><strong>E-mail:</strong> {{ $client->email ?? '—' }}</p>
        <p><strong>Telefone:</strong> {{ $client->phone ?? '—' }}</p>
        <p><strong>Estado:</strong> {{ $client->is_active ? 'Ativo' : 'Inactivo' }}</p>
    </div>

    <div class="card">
        <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:0.5rem;">
            <h2 style="margin:0;font-size:1rem;">Contactos ({{ $client->contacts->count() }})</h2>
            <a href="{{ route('clients.contacts.index', $client) }}">Ver todos</a>
        </div>
        @if ($client->contacts->isEmpty())
            <p style="color:var(--text-muted);margin-bottom:0;">Sem contactos.</p>
        @else
            <table style="margin-top:0.75rem;">
                <thead>
                <tr><th>Nome</th><th>E-mail</th><th>Principal</th><th></th></tr>
                </thead>
                <tbody>
                @foreach ($client->contacts->take(8) as $contact)
                    <tr>
                        <td>{{ $contact->name }}</td>
                        <td>{{ $contact->email ?? '—' }}</td>
                        <td>{{ $contact->is_primary ? 'Sim' : '—' }}</td>
                        <td><a href="{{ route('clients.contacts.edit', [$client, $contact]) }}">Editar</a></td>
                    </tr>
                @endforeach
                </tbody>
            </table>
        @endif
    </div>

    <div class="card">
        <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:0.5rem;">
            <h2 style="margin:0;font-size:1rem;">Equipamentos ({{ $client->equipment->count() }})</h2>
            <a href="{{ route('clients.equipments.index', $client) }}">Ver todos</a>
        </div>
        @if ($client->equipment->isEmpty())
            <p style="color:var(--text-muted);margin-bottom:0;">Sem equipamentos.</p>
        @else
            <table style="margin-top:0.75rem;">
                <thead>
                <tr><th>Código</th><th>Resumo</th><th>Estado</th><th></th></tr>
                </thead>
                <tbody>
                @foreach ($client->equipment->take(8) as $eq)
                    <tr>
                        <td>{{ $eq->internal_code ?? '—' }}</td>
                        <td>{{ collect([$eq->type, $eq->brand, $eq->model])->filter()->implode(' · ') ?: '—' }}</td>
                        <td>{{ $eq->status }}</td>
                        <td><a href="{{ route('clients.equipments.edit', [$client, $eq]) }}">Editar</a></td>
                    </tr>
                @endforeach
                </tbody>
            </table>
        @endif
    </div>

    <div class="card">
        <h2 style="margin-top:0;font-size:1rem;">Últimos tickets</h2>
        <table>
            <thead>
            <tr><th>Número</th><th>Título</th><th>Estado</th></tr>
            </thead>
            <tbody>
            @foreach ($client->tickets as $t)
                <tr>
                    <td><a href="{{ route('tickets.show', $t) }}">{{ $t->number }}</a></td>
                    <td>{{ \Illuminate\Support\Str::limit($t->title, 40) }}</td>
                    <td>@include('partials.status-badge', ['status' => $t->status])</td>
                </tr>
            @endforeach
            </tbody>
        </table>
    </div>
@endsection
