@extends('layouts.app')

@section('title', 'Contactos — '.$client->company_name)

@section('content')
    <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:1rem;">
        <h1 style="margin:0;">Contactos — {{ $client->company_name }}</h1>
        <div style="display:flex;gap:0.5rem;">
            <a href="{{ route('clients.contacts.create', $client) }}" class="btn btn-primary">Novo contacto</a>
            <a href="{{ route('clients.show', $client) }}" class="btn btn-ghost">Cliente</a>
        </div>
    </div>

    <div class="card" style="padding:0;overflow:auto;">
        <table>
            <thead>
            <tr>
                <th>Nome</th>
                <th>Cargo</th>
                <th>E-mail</th>
                <th>Principal</th>
                <th></th>
            </tr>
            </thead>
            <tbody>
            @foreach ($contacts as $contact)
                <tr>
                    <td>{{ $contact->name }}</td>
                    <td>{{ $contact->position ?? '—' }}</td>
                    <td>{{ $contact->email ?? '—' }}</td>
                    <td>{{ $contact->is_primary ? 'Sim' : '—' }}</td>
                    <td>
                        <a href="{{ route('clients.contacts.edit', [$client, $contact]) }}">Editar</a>
                    </td>
                </tr>
            @endforeach
            </tbody>
        </table>
    </div>
@endsection
