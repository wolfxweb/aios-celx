@extends('layouts.app')

@section('title', 'Equipamentos — '.$client->company_name)

@section('content')
    <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:1rem;">
        <h1 style="margin:0;">Equipamentos — {{ $client->company_name }}</h1>
        <div style="display:flex;gap:0.5rem;">
            <a href="{{ route('clients.equipments.create', $client) }}" class="btn btn-primary">Novo equipamento</a>
            <a href="{{ route('clients.show', $client) }}" class="btn btn-ghost">Cliente</a>
        </div>
    </div>

    <div class="card" style="padding:0;overflow:auto;">
        <table>
            <thead>
            <tr>
                <th>Código</th>
                <th>Tipo / marca / modelo</th>
                <th>Série</th>
                <th>Estado</th>
                <th></th>
            </tr>
            </thead>
            <tbody>
            @foreach ($equipments as $eq)
                <tr>
                    <td>{{ $eq->internal_code ?? '—' }}</td>
                    <td>{{ collect([$eq->type, $eq->brand, $eq->model])->filter()->implode(' · ') ?: '—' }}</td>
                    <td>{{ $eq->serial_number ?? '—' }}</td>
                    <td>{{ $eq->status }}</td>
                    <td>
                        <a href="{{ route('clients.equipments.edit', [$client, $eq]) }}">Editar</a>
                    </td>
                </tr>
            @endforeach
            </tbody>
        </table>
    </div>
@endsection
