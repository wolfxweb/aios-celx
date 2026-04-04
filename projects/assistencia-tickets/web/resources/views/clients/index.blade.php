@extends('layouts.app')

@section('title', 'Clientes')

@section('content')
    <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:1rem;">
        <h1 style="margin:0;">Clientes</h1>
        <a href="{{ route('clients.create') }}" class="btn btn-primary">Novo cliente</a>
    </div>

    <form method="get" class="card" style="padding:1rem;">
        <label for="q">Pesquisar</label>
        <div style="display:flex;gap:0.5rem;flex-wrap:wrap;align-items:center;">
            <input type="search" id="q" name="q" value="{{ request('q') }}" placeholder="Nome, razão ou CNPJ">
            <button type="submit" class="btn btn-primary">Filtrar</button>
        </div>
    </form>

    <div class="card" style="padding:0;overflow:auto;">
        <table>
            <thead>
            <tr>
                <th>Razão social</th>
                <th>Nome fantasia</th>
                <th>CPF/CNPJ</th>
                <th>Estado</th>
            </tr>
            </thead>
            <tbody>
            @foreach ($clients as $client)
                <tr>
                    <td><a href="{{ route('clients.show', $client) }}">{{ $client->company_name }}</a></td>
                    <td>{{ $client->trade_name ?? '—' }}</td>
                    <td>{{ $client->tax_id ?? '—' }}</td>
                    <td>{{ $client->is_active ? 'Ativo' : 'Inactivo' }}</td>
                </tr>
            @endforeach
            </tbody>
        </table>
    </div>
    {{ $clients->links() }}
@endsection
