@extends('layouts.app')

@section('title', 'Tickets')

@section('content')
    <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:1rem;">
        <h1 style="margin:0;">Tickets</h1>
        <a href="{{ route('tickets.create') }}" class="btn btn-primary">Abrir ticket</a>
    </div>

    <form method="get" class="card" style="padding:1rem;">
        <label for="q">Pesquisar</label>
        <div style="display:flex;gap:0.5rem;flex-wrap:wrap;">
            <input type="search" id="q" name="q" value="{{ request('q') }}" placeholder="Número ou título">
            <button type="submit" class="btn btn-primary">Filtrar</button>
        </div>
    </form>

    <div class="card" style="padding:0;overflow:auto;">
        <table>
            <thead>
            <tr>
                <th>Número</th>
                <th>Título</th>
                <th>Cliente</th>
                <th>Prioridade</th>
                <th>Estado</th>
            </tr>
            </thead>
            <tbody>
            @foreach ($tickets as $ticket)
                <tr>
                    <td><a href="{{ route('tickets.show', $ticket) }}">{{ $ticket->number }}</a></td>
                    <td>{{ \Illuminate\Support\Str::limit($ticket->title, 60) }}</td>
                    <td>{{ $ticket->client->company_name }}</td>
                    <td>{{ $ticket->priority }}</td>
                    <td>@include('partials.status-badge', ['status' => $ticket->status])</td>
                </tr>
            @endforeach
            </tbody>
        </table>
    </div>
    {{ $tickets->links() }}
@endsection
