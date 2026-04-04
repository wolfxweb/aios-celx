@extends('layouts.app')

@section('title', 'Utilizadores')

@section('content')
    <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:1rem;">
        <h1 style="margin:0;">Utilizadores</h1>
        <a href="{{ route('users.create') }}" class="btn btn-primary">Novo utilizador</a>
    </div>

    <div class="card" style="padding:0;overflow:auto;">
        <table>
            <thead>
            <tr><th>Nome</th><th>E-mail</th><th>Perfil</th><th>Cliente</th><th></th></tr>
            </thead>
            <tbody>
            @foreach ($users as $u)
                <tr>
                    <td>{{ $u->name }}</td>
                    <td>{{ $u->email }}</td>
                    <td>{{ $u->role }}</td>
                    <td>{{ $u->client?->company_name ?? '—' }}</td>
                    <td><a href="{{ route('users.edit', $u) }}">Editar</a></td>
                </tr>
            @endforeach
            </tbody>
        </table>
    </div>
    {{ $users->links() }}
@endsection
